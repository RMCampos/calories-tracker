import { foodDatabase } from './foodDatabase.js';
import { getButtonById, getButtonListByClassName, getDivById, getInputById, showFoodPreview } from './DomUtils.ts';
import { DailyTotalCalories, FoodItem, FoodStorage } from './types.js';
import { AppwriteAuth, AppwriteDB } from './appwrite.js';
import swal from 'sweetalert';
import { closeMobileMenu, delay, getCleanName, getIcon, handleMobileCalendarClick, hideLoading, hideSearchResults, navigateResultsKeyboard, QUICK_DELAY, scrollToCalendarView, showLoading, toggleCardHandler, toggleMobileMenu } from './Utils.ts';
import { showAuthForms, toggleAuthForms, showRegisterForm, showLoginForm, hideAuthForms, closeAuthModal } from './auth.ts';
import { appState } from "./state";
import { getNutritionInfo, NutritionInfo, clearNutritionCache, getCacheStats } from './claudeService';

// PWA Service Worker Registration
import { registerSW } from 'virtual:pwa-register'

const updateSW = registerSW({
  onNeedRefresh() {
    swal({
      title: 'Update Available',
      text: 'New content is available. Reload to update?',
      icon: 'info',
      buttons: {
        cancel: 'Later',
        confirm: 'Update Now'
      }
    }).then((willUpdate) => {
      if (willUpdate) {
        updateSW(true)
      }
    })
  },
  onOfflineReady() {
    console.log('App ready to work offline')
  },
})

// App state
let selectedDate = new Date();
let currentViewDate = new Date();
let selectedFood: FoodItem | null = null; // review here
let currentUser: any | null = null;

// Initialize when page loads
document.addEventListener('DOMContentLoaded', async function() {
  await initializeAuth();
  updateCurrentDate();
  setupEventListeners();
});

async function initializeAuth() {
  // Check if this is a shared view first
  const urlParams = new URLSearchParams(window.location.search);
  const shareId = urlParams.get('share');

  if (shareId) {
    await checkSharedView();
    return;
  }

  showLoading();

  try {
    const isLoggedIn = await AppwriteAuth.isLoggedIn();

    if (isLoggedIn) {
      currentUser = await AppwriteAuth.getCurrentUser();
      await showMainApp();
      selectDate(selectedDate);
    } else {
      showAuthForms();
    }
  } catch (error) {
    console.error('Initialize app error:', error);
    showAuthForms();
  } finally {
    hideLoading();
  }
}



async function handleRegister(e: SubmitEvent) {
  e.preventDefault();
  showLoading();

  const name = getInputById('registerName').value;
  const email = getInputById('registerEmail').value;
  const password = getInputById('registerPassword').value;

  try {
    await AppwriteAuth.register(email, password, name);

    // Auto login after registration
    await AppwriteAuth.login(email, password);
    currentUser = await AppwriteAuth.getCurrentUser();

    closeAuthModal();
    await showMainApp();
    selectDate(selectedDate);

    swal('Registration successful! Welcome to Food Tracker.');
  } catch (error) {
    console.error('Registration error:', error);
    if (error instanceof Error) {
      swal('Oh no!', 'Registration failed: ' + error.message, 'error');
    }
  } finally {
    hideLoading();
  }
}

async function handleLogin(e: SubmitEvent) {
  e.preventDefault();
  showLoading();

  const email = getInputById('loginEmail').value;
  const password = getInputById('loginPassword').value;

  try {
    await AppwriteAuth.login(email, password);
    currentUser = await AppwriteAuth.getCurrentUser();

    closeAuthModal();
    await showMainApp();
    selectDate(selectedDate);

  } catch (error) {
    console.error('Login error:', error);
    if (error instanceof Error) {
      swal('Oh no!', 'Login failed: ' + error.message, 'error');
    }
  } finally {
    hideLoading();
  }
}

async function processResponseItems<T, R>(
  response: T[],
  processItem: (item: T) => Promise<R>
): Promise<R[]> {
  
  // Create promises for each item (but don't execute yet)
  const promises = response.map(item => processItem(item));
  
  // Execute all promises concurrently and wait for completion
  const results = await Promise.all(promises);
  
  return results;
}

async function fetchUserSettings(documentId: string): Promise<any> {
  return AppwriteDB.deleteUserSettings(documentId);
}

async function handleBulkDelete(idsToDelete: string[]): Promise<void> {
  try {
    // This creates and executes all promises concurrently
    const results = await processResponseItems(idsToDelete, fetchUserSettings);
    console.debug('All requests completed:', results);
  } catch (error) {
    console.error('One or more requests failed:', error);
  }
}

async function handleSaveSettings(e: SubmitEvent) {
  e.preventDefault();
  showLoading();

  try {
    const caloriesGoal = getInputById('caloriesGoal').value;
    const proteinGoal = getInputById('proteinGoal').value;
    const fatGoal = getInputById('fatGoal').value;
    const carboGoal = getInputById('carboGoal').value;
    const fiberGoal = getInputById('fiberGoal').value;

    // Delete existing settings - keep only the new one
    const documents = await AppwriteDB.getUserSettings();
    const documentsToDelete: string[] = [];
    for (let i=0; i<documents.length; i++) {
      documentsToDelete.push(documents[i].$id);
    }

    if (documentsToDelete) {
      await handleBulkDelete(documentsToDelete);
    }

    await AppwriteDB.saveUserSettings({
      caloriesGoal: parseInt(caloriesGoal),
      proteinGoal: parseInt(proteinGoal),
      fatGoal: parseInt(fatGoal),
      carboGoal: parseInt(carboGoal),
      fiberGoal: parseInt(fiberGoal),
    });

    hideLoading();
    toggleSettingsView();
    selectDate(selectedDate);
  } catch (error) {
    hideLoading();
    console.error('Saving error:', error);
    if (error instanceof Error) {
      swal('Oh no!', 'Saving failed: ' + error.message, 'error');
    }
  }
}

function updateCacheStats() {
  try {
    const stats = getCacheStats();
    const cacheItemCountEl = document.getElementById('cacheItemCount');
    const cacheSizeEl = document.getElementById('cacheSize');

    if (cacheItemCountEl) {
      cacheItemCountEl.textContent = stats.size.toString();
    }

    if (cacheSizeEl) {
      cacheSizeEl.textContent = `${stats.sizeInKB} KB`;
    }
  } catch (error) {
    console.error('Error updating cache stats:', error);
  }
}

async function handleClearCache() {
  try {
    const result = await swal({
      title: 'Clear Cache?',
      text: 'This will remove all cached nutrition data. You may need to fetch this data again from the AI.',
      icon: 'warning',
      buttons: ['Cancel', 'Clear Cache'],
      dangerMode: true,
    });

    if (result) {
      clearNutritionCache();
      updateCacheStats();
      swal('Success', 'Cache cleared successfully!', 'success');
    }
  } catch (error) {
    console.error('Error clearing cache:', error);
    swal('Error', 'Failed to clear cache', 'error');
  }
}

function handleAICheckboxChange(e: Event) {
  const checkbox = e.target as HTMLInputElement;

  if (checkbox.checked) {
    // If a food is already selected, load its AI nutrition info
    if (selectedFood) {
      loadAINutritionInfo(selectedFood.name);
    }
  } else {
    // Hide the AI nutrition card
    hideAINutritionCard();
  }
}

async function handleLogout() {
  showLoading();
  
  try {
    await AppwriteAuth.logout();
    currentUser = null;
    showAuthForms();
    clearAppData();
    hideLoading();
  } catch (error) {
    hideLoading();
    console.error('Logout error:', error);
    if (error instanceof Error) {
      swal('Oh no!', 'Logout failed: ' + error.message, 'error');
    }
  }
}

async function toggleSettingsView() {
  const showSettings = getButtonById('settingsBtn').textContent.includes('Settings');

  if (showSettings) {
    showLoading();

    try {
      const settings = await AppwriteDB.getUserSettings();
      const hasGoals = Array.isArray(settings) && settings.length > 0;
      if (hasGoals) {
        const index = settings.length - 1;
        getInputById('caloriesGoal').value = settings[index].caloriesGoal;
        getInputById('proteinGoal').value = settings[index].proteinGoal;
        getInputById('fatGoal').value = settings[index].fatGoal;
        getInputById('carboGoal').value = settings[index].carboGoal;
        getInputById('fiberGoal').value = settings[index].fiberGoal;
      } else {
        getInputById('caloriesGoal').value = '';
        getInputById('proteinGoal').value = '';
        getInputById('fatGoal').value = '';
        getInputById('carboGoal').value = '';
        getInputById('fiberGoal').value = '';
      }
      
      getButtonById('settingsBtn').textContent = '🔙 Back';
      getButtonById('settingsBtnMobile').textContent = '🔙 Back';

      getDivById('app-content').classList.add('hidden');
      getDivById('settings-content').classList.remove('hidden');

      // Update cache statistics display
      updateCacheStats();

      hideLoading();
    } catch (error) {
      hideLoading();
      console.error('Fetching settings failed:', error);
      if (error instanceof Error) {
        swal('Oh no!', 'Fetching settings failed: ' + error.message, 'error');
      }
    }
  }
  else {
    getDivById('app-content').classList.remove('hidden');
    getDivById('settings-content').classList.add('hidden');
    getButtonById('settingsBtn').textContent = '⚙️ Settings';
    getButtonById('settingsBtnMobile').textContent = '⚙️ Settings';
  }
}

async function handleMobileSettingsClick() {
  closeMobileMenu();
  await toggleSettingsView();
}

async function showMainApp() {
  hideAuthForms();
  getDivById('user-info').classList.remove('hidden');
  getDivById('app-content').classList.remove('hidden');

  if (currentUser) {
    getDivById('userName').textContent = `Welcome, ${currentUser.name}!`;
  }

  updateCurrentDate();

  // Get daily entries with total from Appwrite to display in calendar
  fetchCaloriesCurrentMonth();
}

async function fetchCaloriesCurrentMonth() {
  const entries = await AppwriteDB.getMonthlyCalories(selectedDate);
  entries.forEach((entry) => {
    const calories = parseInt(entry.totalCalories);
    let day = parseInt(entry.date.substring(8));
    // New rule starting in October 31st, 2025
    if (selectedDate >= new Date('2025-10-31')) {
      day = parseInt(entry.date.substring(8)) + parseInt(entry.date.substring(5,7)) + parseInt(entry.date.substring(0,4));
    }
    updateDocumentIdForDay(entry.$id, calories, day);
  });
}

function clearEditing() {
  getInputById('foodSearchInput').value = '';
  getInputById('gramAmount').value = '100';
  showFoodPreview(false);
  hideAINutritionCard();
  getDivById('add-foot-title').innerHTML = 'Add Food Entry';
  getButtonById('add-food-btn').innerHTML = 'Add Food';
  getButtonById('cancel-food-btn').style.display = 'none';

  // Clear edit-specific hidden inputs
  getInputById('foodIdToUpdate').value = '';
  getInputById('foodTimeToUpdate').value = '';
  getInputById('foodCaloriesToUpdate').value = '';

  selectedFood = null;
}

// Clear application data
function clearAppData() {
  getDivById('caloriesCounter').textContent = '0';
  getInputById('foodSearchInput').value = '';
  getInputById('gramAmount').value = '100';
  getDivById('foodCardsContainer').innerHTML = `
      <div class="empty-state">
          <div class="empty-state-icon">🍽️</div>
          <div>No food items logged yet.</div>
          <div style="margin-top: 8px; font-size: 14px; opacity: 0.7;">Add your first item to get started!</div>
      </div>
  `;
  selectedFood = null;
  getButtonById('cancel-food-btn').style.display = 'none';
}

const getFoodData = (grams: number, foodData: FoodItem): FoodItem => {
  const multiplier = grams / 100; // Database values are per 100g
  return {
    ...foodData,
    info: {
      calories: Math.round(foodData.info.calories * multiplier),
      protein: Math.round(foodData.info.protein * multiplier * 10) / 10,
      fat: Math.round(foodData.info.fat * multiplier * 10) / 10,
      carbs: Math.round(foodData.info.carbs * multiplier * 10) / 10,
      fiber: Math.round(foodData.info.fiber * multiplier * 10) / 10,
      category: foodData.info.category,
      alkaline: foodData.info.alkaline
    }
  };
}

const getFoodItemByName = (foodName: string): FoodItem => {
  const foodDataSearch: FoodItem[] = foodDatabase.filter(f => f.name === foodName);
  if (foodDataSearch.length === 0) {
    throw new Error(`Food not found for name ${foodName}`);
  }
  return foodDataSearch[0];
}

const previewCalories = (foodSelected?: FoodItem) => {
  const foodToPreview = foodSelected ?? selectedFood;
  const gramAmount = getInputById('gramAmount');
  
  if (!foodToPreview) {
    showFoodPreview(false);
    return;
  }

  let grams = 100;
  if (gramAmount && gramAmount.value && parseFloat(gramAmount.value) > 0) {
    grams = parseFloat(gramAmount.value);
  }

  const foodData: FoodItem = getFoodItemByName(foodToPreview.name);
  const proportion = getFoodData(grams, foodData);

  getDivById('calorieValuePreview').textContent = proportion.info.calories.toString();
  getDivById('proteinValuePreview').textContent = (Math.round(proportion.info.protein * 10) / 10).toString ();
  getDivById('fatValuePreview').textContent = (Math.round(proportion.info.fat * 10) / 10).toString ();
  getDivById('carboValuePreview').textContent = (Math.round(proportion.info.carbs * 10) / 10).toString ();
  getDivById('fiberValuePreview').textContent = (Math.round(proportion.info.fiber * 10) / 10).toString ();

  showFoodPreview(true);
}

const setupEventListeners = () => {
  getInputById('foodSearchInput').addEventListener('change', (e: Event) => {
    const target = e.target as HTMLInputElement;
    if (target.value === ''){
      showFoodPreview(false);
      hideAINutritionCard();
    }
  });

  getInputById('gramAmount').addEventListener('change', () => {
    previewCalories();
  });

  getButtonById('add-food-btn').addEventListener('click', () => {
    if (getButtonById('add-food-btn').innerHTML === 'Add Food') {
      addFood();
    } else {
      updateFood();
    }
  });
  
  getButtonById('next-month-btn').addEventListener('click', () => {
    nextMonth();
  });
  
  getButtonById('previous-month-btn').addEventListener('click', () => {
    previousMonth();
  });

  // Form switching
  document.getElementById('showRegister')?.addEventListener('click', (e) => {
      e.preventDefault();
      toggleAuthForms();
  });
  
  document.getElementById('showLogin')?.addEventListener('click', (e) => {
      e.preventDefault();
      toggleAuthForms();
  });

  getButtonById('cancel-food-btn').addEventListener('click', () => {
    clearEditing();
  });

  // Auth forms
  document.getElementById('loginForm')?.addEventListener('submit', handleLogin);
  document.getElementById('registerForm')?.addEventListener('submit', handleRegister);
  
  // Desktop header buttons
  getButtonById('logoutBtn').addEventListener('click', handleLogout);
  getButtonById('settingsBtn').addEventListener('click', toggleSettingsView);
  getButtonById('calendarBtn').addEventListener('click', scrollToCalendarView);
  
  // Mobile header buttons
  getButtonById('logoutBtnMobile').addEventListener('click', handleLogout);
  getButtonById('settingsBtnMobile').addEventListener('click', handleMobileSettingsClick);
  getButtonById('calendarBtnMobile').addEventListener('click', handleMobileCalendarClick);
  
  // Mobile menu toggle
  document.getElementById('mobileMenuToggle')?.addEventListener('click', toggleMobileMenu);
  
  // Settings form
  document.getElementById('settingsForm')?.addEventListener('submit', handleSaveSettings);

  // Clear cache button
  getButtonById('clearCacheBtn')?.addEventListener('click', handleClearCache);

  // AI nutrition checkbox
  document.getElementById('enableAINutrition')?.addEventListener('change', handleAICheckboxChange);

  // Share button event listeners
  getButtonById('shareBtn').addEventListener('click', handleShareClick);
  getButtonById('shareBtnMobile').addEventListener('click', handleShareClick);
  getButtonById('close-share-modal').addEventListener('click', closeShareModal);
  document.getElementById('copy-share-link')?.addEventListener('click', copyShareLink);

  // Landing page CTA button event listeners
  document.getElementById('cta-register-btn')?.addEventListener('click', () => {
    showRegisterForm();
  });
  document.getElementById('cta-login-btn')?.addEventListener('click', () => {
    showLoginForm();
  });

  // Header auth button event listeners
  document.getElementById('open-login-btn')?.addEventListener('click', () => {
    showLoginForm();
  });
  document.getElementById('open-register-btn')?.addEventListener('click', () => {
    showRegisterForm();
  });

  // Close auth modal
  document.getElementById('close-auth-modal')?.addEventListener('click', () => {
    closeAuthModal();
  });

  // Close modal when clicking outside
  document.getElementById('auth-modal')?.addEventListener('click', (e) => {
    if (e.target === document.getElementById('auth-modal')) {
      closeAuthModal();
    }
  });

  // Search functionality
  getInputById('foodSearchInput').addEventListener('input', function(e: Event) {
    const target = e.target as HTMLInputElement;
    const query = target.value.trim();
    
    if (query.length === 0) {
      hideSearchResults();
      return;
    }

    // Show loading
    getDivById('searchLoading').classList.add('show');
    
    // Clear previous timeout
    if (appState.searchTimeout) {
      clearTimeout(appState.searchTimeout);
    }
    
    // Debounce search
    appState.searchTimeout = setTimeout(() => {
      performSearch(query);
    }, 300);
  });

  // Keyboard navigation
  getInputById('foodSearchInput').addEventListener('keydown', function(e) {
    if (!getDivById('searchResults').classList.contains('show')) return;
      
    switch(e.key) {
      case 'ArrowDown':
        e.preventDefault();
        navigateResultsKeyboard(1);
        break;
      case 'ArrowUp':
        e.preventDefault();
        navigateResultsKeyboard(-1);
        break;
      case 'Enter':
        e.preventDefault();
        if (appState.currentHighlightIndex >= 0 && appState.searchResults[appState.currentHighlightIndex]) {
          selectFood(appState.searchResults[appState.currentHighlightIndex]);
        }
        break;
      case 'Escape':
        hideSearchResults();
        break;
    }
  });

  // Click outside to close search results
  document.addEventListener('click', function(e: Event) {
    const target = e.target as HTMLElement;
    if (!getDivById('searchResults').contains(target) && !getInputById('foodSearchInput').contains(target)) {
      hideSearchResults();
    }
  });

  // Click outside to close mobile menu
  document.addEventListener('click', function(e: Event) {
    const target = e.target as HTMLElement;
    const mobileMenu = document.getElementById('mobileMenu');
    const mobileMenuToggle = document.getElementById('mobileMenuToggle');
    
    if (mobileMenu && mobileMenuToggle && 
        !mobileMenu.contains(target) && 
        !mobileMenuToggle.contains(target)) {
      closeMobileMenu();
    }
  });
}

function performSearch(query: string) {
  const results: FoodItem[] = foodDatabase.filter(food => {
    const cleanName = getCleanName(food.name);
    const cleanNameEn = getCleanName(food.nameEn);
    const category = food.info.category.toLowerCase();
    return cleanName.includes(query.toLowerCase()) || cleanNameEn.includes(query.toLowerCase()) || category.includes(query.toLowerCase())
  }).slice(0, 5); // Limit to 5 results

  appState.searchResults = results;
  displaySearchResults(results);
  getDivById('searchLoading').classList.remove('show');
}

function displaySearchResults(results: FoodItem[]) {
  if (results.length === 0) {
    getDivById('searchResults').innerHTML = '<div class="no-results">No foods found. Try a different search term.</div>';
  } else {
    getDivById('searchResults').innerHTML = results.map((food, index) => `
        <div class="search-result-item" data-index="${index}" onclick="selectFood(${JSON.stringify(food).replace(/"/g, '&quot;')})">
            <div class="food-info">
                <div class="food-name">${getIcon(food.info.category)} ${food.name}</div>
                <div class="food-details">${food.info.category} • 100 g</div>
            </div>
            <div class="food-calories">${food.info.calories} cal</div>
        </div>
    `).join('');
  }
    
  getDivById('searchResults').classList.add('show');
  appState.currentHighlightIndex = -1;
}

// AI Nutrition Card Functions
function showAINutritionCard() {
  const card = getDivById('ai-nutrition-card');
  card.classList.remove('display-none');
  card.classList.add('display-block');
}

function hideAINutritionCard() {
  const card = getDivById('ai-nutrition-card');
  card.classList.add('display-none');
  card.classList.remove('display-block');
}

function showAILoading() {
  getDivById('ai-nutrition-loading').classList.remove('hidden');
  getDivById('ai-nutrition-error').classList.add('hidden');
  getDivById('ai-nutrition-content').classList.add('hidden');
}

function showAIError() {
  getDivById('ai-nutrition-loading').classList.add('hidden');
  getDivById('ai-nutrition-error').classList.remove('hidden');
  getDivById('ai-nutrition-content').classList.add('hidden');
}

function showAIContent(nutritionInfo: NutritionInfo) {
  getDivById('ai-nutrition-loading').classList.add('hidden');
  getDivById('ai-nutrition-error').classList.add('hidden');
  getDivById('ai-nutrition-content').classList.remove('hidden');

  // Populate vitamins
  const vitaminsList = document.getElementById('ai-vitamins-list');
  if (vitaminsList) {
    vitaminsList.innerHTML = nutritionInfo.vitamins.map(v => `<li>${v}</li>`).join('');
  }

  // Populate minerals
  const mineralsList = document.getElementById('ai-minerals-list');
  if (mineralsList) {
    mineralsList.innerHTML = nutritionInfo.minerals.map(m => `<li>${m}</li>`).join('');
  }

  // Populate benefits
  const benefitsList = document.getElementById('ai-benefits-list');
  if (benefitsList) {
    benefitsList.innerHTML = nutritionInfo.benefits.map(b => `<li>${b}</li>`).join('');
  }

  // Populate notes
  const notesText = document.getElementById('ai-notes-text');
  const notesSection = document.getElementById('ai-notes-section');
  if (notesText && notesSection && nutritionInfo.notes) {
    notesText.textContent = nutritionInfo.notes;
    notesSection.classList.remove('hidden');
  } else if (notesSection) {
    notesSection.classList.add('hidden');
  }
}

async function loadAINutritionInfo(foodName: string) {
  showAINutritionCard();
  showAILoading();

  try {
    const nutritionInfo = await getNutritionInfo(foodName);
    showAIContent(nutritionInfo);
  } catch (error) {
    console.error('Error loading AI nutrition info:', error);
    showAIError();
  }
}

function selectFood(food: FoodItem) {
  selectedFood = food;

  getInputById('foodSearchInput').value = food.name;
  hideSearchResults();
  getInputById('gramAmount').focus();
  previewCalories(food);

  // Show cancel button so user can clear selection
  getButtonById('cancel-food-btn').style.display = 'inline-block';

  // Load AI nutrition info only if checkbox is checked
  const aiCheckbox = document.getElementById('enableAINutrition') as HTMLInputElement;
  if (aiCheckbox && aiCheckbox.checked) {
    loadAINutritionInfo(food.name);
  } else {
    hideAINutritionCard();
  }
}

async function setFoodToEdit(foodId: string) {
  showLoading();

  try {
    // get food item
    const entries = await AppwriteDB.getFoodEntries(selectedDate);
    const foodToEdit = entries.filter(entry => entry.$id === foodId);
    if (foodToEdit.length === 0) {
      swal('Hey!', 'Unable to get food entry from server', 'error');
      return;
    }

    // set the selected food name and quantity
    const foodData: FoodItem = getFoodItemByName(foodToEdit[0].name);
    selectedFood = foodData;
    getInputById('foodSearchInput').value = foodToEdit[0].name;
    getInputById('gramAmount').value = foodToEdit[0].grams;
    previewCalories(foodData)

    getDivById('add-foot-title').innerHTML = 'Edit Food Entry';
    getButtonById('add-food-btn').innerHTML = 'Save Food';
    getButtonById('cancel-food-btn').style.display = 'inline-block';
    getInputById('foodIdToUpdate').value = foodId;
    getInputById('foodTimeToUpdate').value = foodToEdit[0].time;
    getInputById('foodCaloriesToUpdate').value = foodToEdit[0].calories;

    // Scroll to top
    const titleDiv = getDivById('add-foot-title') as HTMLElement;
    if (titleDiv) {
      titleDiv.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }

    hideLoading();
  } catch (error) {
    console.error('Set food to edit error:', error);
    if (error instanceof Error) {
      swal('Oh no!', 'Failed to load food entry: ' + error.message, 'error');
    }
  } finally {
    hideLoading();
  }
}

async function setFoodToCopy(foodId: string) {
  showLoading();

  try {
    // get food item
    const entries = await AppwriteDB.getFoodEntries(selectedDate);
    const foodToCopy = entries.filter(entry => entry.$id === foodId);
    if (foodToCopy.length === 0) {
      swal('Hey!', 'Unable to get food entry from server', 'error');
      return;
    }

    // set the selected food name and quantity (same as original)
    const foodData: FoodItem = getFoodItemByName(foodToCopy[0].name);
    selectedFood = foodData;
    getInputById('foodSearchInput').value = foodToCopy[0].name;
    getInputById('gramAmount').value = foodToCopy[0].grams;
    previewCalories(foodData)

    // Set UI to copy mode (not edit mode)
    getDivById('add-foot-title').innerHTML = 'Copy Food Entry';
    getButtonById('add-food-btn').innerHTML = 'Add Food';
    getButtonById('cancel-food-btn').style.display = 'inline-block';
    
    // Clear edit-specific hidden inputs to ensure we're in add mode
    getInputById('foodIdToUpdate').value = '';
    getInputById('foodTimeToUpdate').value = '';
    getInputById('foodCaloriesToUpdate').value = '';

    // Scroll to top
    const titleDiv = getDivById('add-foot-title') as HTMLElement;
    if (titleDiv) {
      titleDiv.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }

    hideLoading();
  } catch (error) {
    console.error('Set food to copy error:', error);
    if (error instanceof Error) {
      swal('Oh no!', 'Failed to load food entry: ' + error.message, 'error');
    }
  } finally {
    hideLoading();
  }
}

function deleteCardHandler(e: Event) {
  e.preventDefault();
  e.stopPropagation();

  const card = e.currentTarget as HTMLElement;
  const foodId = card.getAttribute('data-food-id');

  if (foodId) {
    handleDeleteFood(foodId);
  }
}

function editCardHandler(e: Event) {
  e.preventDefault();
  e.stopPropagation();

  const card = e.currentTarget as HTMLElement;
  const foodId = card.getAttribute('data-food-id');

  if (foodId) {
    setFoodToEdit(foodId);
  }
}

function copyCardHandler(e: Event) {
  e.preventDefault();
  e.stopPropagation();

  const card = e.currentTarget as HTMLElement;
  const foodId = card.getAttribute('data-food-id');

  if (foodId) {
    setFoodToCopy(foodId);
  }
}

const setupEditAndDeleteEvents = () => {
  // Setup toggle show cards events
  const cards = getButtonListByClassName('card-header-toggle');
  Array.from(cards).forEach((card: HTMLElement) => {
    card.removeEventListener('click', toggleCardHandler);
    card.addEventListener('click', toggleCardHandler);
  });

  // Setup copy card events
  const copyCards = getButtonListByClassName('btn-copy');
  Array.from(copyCards).forEach((card: HTMLElement) => {
    card.removeEventListener('click', copyCardHandler);
    card.addEventListener('click', copyCardHandler);
  });

  // Setup delete card events
  const deleteCards = getButtonListByClassName('btn-delete');
  Array.from(deleteCards).forEach((card: HTMLElement) => {
    card.removeEventListener('click', deleteCardHandler);
    card.addEventListener('click', deleteCardHandler);
  });

  // Setup edit card events
  const editCards = getButtonListByClassName('btn-edit');
  Array.from(editCards).forEach((card: HTMLElement) => {
    card.removeEventListener('click', editCardHandler);
    card.addEventListener('click', editCardHandler);
  });
}

const updateCurrentDate = () => {
  const date = new Date(selectedDate);
  getDivById('currentDate').textContent = date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

const updateFood = async () => {
  if (!currentUser) {
    swal('Hey!', 'Please log in to add food entries.', 'info');
    return;
  }

  const gramAmount = getInputById('gramAmount');
    
  if (!selectedFood || !gramAmount.value) {
    swal('Hey!', 'Please select a food item and enter the amount', 'error');
    return;
  }

  showLoading();

  try {
    const foodId = getInputById('foodIdToUpdate').value;
    const grams: number = parseFloat(gramAmount.value);
    const foodData: FoodItem = getFoodItemByName(selectedFood.name);

    // Current date, with timezone
    const date = new Date(selectedDate.getTime() - (selectedDate.getTimezoneOffset() * 60000)).toISOString();

    // Calculate nutrition for the amount
    const proportion: FoodItem = getFoodData(grams, foodData);
    const entry: FoodStorage = {
      name: selectedFood.name,
      grams: grams,
      calories: proportion.info.calories,
      protein: proportion.info.protein,
      fat: proportion.info.fat,
      carbs: proportion.info.carbs,
      fiber: proportion.info.fiber,
      date: date.split('T')[0],
      alkaline: selectedFood.info.alkaline,
      time: getInputById('foodTimeToUpdate').value,
    };

    // Save to Appwrite
    await AppwriteDB.updateFoodEntry(foodId, entry);

    // Save or update monthly total calories
    const monthlyDocumentId = getDocumentIdForToday();
    if (!monthlyDocumentId?.documentId) {
      const monthlyCreated = await AppwriteDB.createMonthlyCaloryForDay(selectedDate, entry.calories);
      updateDocumentIdForToday(monthlyCreated.$id, monthlyCreated.totalCalories);
    } else {
      const gramsToRemove = parseInt(getInputById('foodCaloriesToUpdate').value);
      const totalCalories = monthlyDocumentId?.totalCalories + entry.calories - gramsToRemove;
      const monthlyUpdated = await AppwriteDB.updateMonthlyCaloryForDay(monthlyDocumentId?.documentId, selectedDate, totalCalories);
      updateDocumentIdForToday(monthlyUpdated.$id, monthlyUpdated.totalCalories);
    }
    delay(QUICK_DELAY);
    clearEditing();
    selectDate(selectedDate);
  } catch (error) {
      console.error('Update food error:', error);
      if (error instanceof Error) {
        swal('Oh no!', 'Failed to update food entry: ' + error.message, 'error');
      }
  } finally {
      hideLoading();
  }
}

const getDocumentIdForToday = (): DailyTotalCalories | null => {
  let today = selectedDate.getDate();
  // New rule: today number will be the sum of the day, month, and year
  if (selectedDate >= new Date('2025-10-31')) {
    // New rule: today number will be the sum of the day, month, and year
    today = selectedDate.getDate() + selectedDate.getMonth() + 1 + selectedDate.getFullYear();
  }
  const todayRecord = appState.calendarMonthlyCalories.filter(x => x.day === today);
  if (todayRecord.length > 0) {
    return todayRecord[0];
  }
  return null;
}

/**
 * Get the document ID for a specific day.
 * The day parameter is the day of the month (1-31) or the sum of day, month, and year for dates after October 30th, 2025.
 *
 * @param day - The day of the month (1-31) or the sum of day, month, and year for dates after October 30th, 2025.
 * @returns The document ID for the day or 0 if not found.
 */
const getDocumentIdForDay = (day: number): number => {
  const todayRecord = appState.calendarMonthlyCalories.filter(x => x.day === day);
  return todayRecord.length > 0 ? todayRecord[0].totalCalories : 0;
}

const updateDocumentIdForToday = (id: string, totalCalories: number): void => {
  let today = selectedDate.getDate();
  // Adopt new rule starting in October 31st, 2025
  if (selectedDate >= new Date('2025-10-31')) {
    // New rule: today number will be the sum of the day, month, and year
    today = selectedDate.getDate() + selectedDate.getMonth() + 1 + selectedDate.getFullYear();
  }
  updateDocumentIdForDay(id, totalCalories, today);
}

/**
 * Update or add the document ID for a specific day in the app state. The day is based on the date selected.
 * The day parameter is the day of the month (1-31) or the sum of day, month, and year for dates after October 30th, 2025.
 *
 * @param {string} id - The document ID to set.
 * @param {number} totalCalories - The total calories for the day.
 * @param {number} day - The day of the month (1-31) or the sum of day, month, and year.
 */
const updateDocumentIdForDay = (id: string, totalCalories: number, day: number): void => {
  const record = appState.calendarMonthlyCalories.filter(x => x.day === day);
  if (record.length === 0) {
    appState.calendarMonthlyCalories.push({
      documentId: id,
      day: day,
      totalCalories: totalCalories
    });
  } else {
    appState.calendarMonthlyCalories.forEach((record) => {
      if (record.day === day) {
        record.documentId = id;
        record.totalCalories = totalCalories;
      }
    });
  }
}

const addFood = async () => {
  if (!currentUser) {
    swal('Hey!', 'Please log in to add food entries.', 'info');
    return;
  }

  const gramAmount = getInputById('gramAmount');
    
  if (!selectedFood || !gramAmount.value) {
    swal('Hey!', 'Please select a food item and enter the amount', 'error');
    return;
  }

  showLoading();

  try {
    const grams: number = parseFloat(gramAmount.value);
    const foodData: FoodItem = getFoodItemByName(selectedFood.name);

    // Current date, with timezone
    const date = new Date(selectedDate.getTime() - (selectedDate.getTimezoneOffset() * 60000)).toISOString();

    // Calculate nutrition for the amount
    const proportion: FoodItem = getFoodData(grams, foodData);
    const entry: FoodStorage = {
      name: selectedFood.name,
      grams: grams,
      calories: proportion.info.calories,
      protein: proportion.info.protein,
      fat: proportion.info.fat,
      carbs: proportion.info.carbs,
      fiber: proportion.info.fiber,
      date: date.split('T')[0],
      alkaline: selectedFood.info.alkaline,
      time: new Date().toLocaleTimeString('en-US', { 
        hour12: false, 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    };

    // Save to Appwrite
    const savedEntry = await AppwriteDB.saveFoodEntry(entry);

    // Save or update monthly total calories
    const monthlyDocumentId = getDocumentIdForToday();
    if (!monthlyDocumentId?.documentId) {
      // create
      const monthlyCreated = await AppwriteDB.createMonthlyCaloryForDay(selectedDate, entry.calories);
      updateDocumentIdForToday(monthlyCreated.$id, monthlyCreated.totalCalories);
    } else {
      // update
      const totalCalories = monthlyDocumentId?.totalCalories + entry.calories;
      const monthlyCreated = await AppwriteDB.updateMonthlyCaloryForDay(monthlyDocumentId?.documentId, selectedDate, totalCalories);
      updateDocumentIdForToday(monthlyCreated.$id, monthlyCreated.totalCalories);
    }

    addFoodToView(entry, savedEntry.$id);
    updateTotalCalories();

    // Update total macros
    const proteinDiv: HTMLElement = getDivById('proteinValue');
    const fatDiv: HTMLElement = getDivById('fatValue');
    const carboDiv: HTMLElement = getDivById('carboValue');
    const fiberDiv: HTMLElement = getDivById('fiberValue');

    const totalProtein: number = parseInt(proteinDiv.textContent ?? '0') + proportion.info.protein;
    const totalFat: number = parseInt(fatDiv.textContent ?? '0') + proportion.info.fat;
    const totalCarbs: number = parseInt(carboDiv.textContent ?? '0') + proportion.info.carbs;
    const totalFiber: number = parseInt(fiberDiv.textContent ?? '0') + proportion.info.fiber;

    proteinDiv.textContent = (Math.round(totalProtein * 10) / 10).toString();
    fatDiv.textContent = (Math.round(totalFat * 10) / 10).toString();
    carboDiv.textContent = (Math.round(totalCarbs * 10) / 10).toString();
    fiberDiv.textContent = (Math.round(totalFiber * 10) / 10).toString();

    // Reset form
    selectedFood = null;
    getInputById('foodSearchInput').value = '';
    gramAmount.value = '100';
    showFoodPreview(false);
    hideAINutritionCard();
    await delay(QUICK_DELAY);
    renderCalendar();
  } catch (error) {
      console.error('Add food error:', error);
      if (error instanceof Error) {
        swal('Oh no!', 'Failed to add food entry: ' + error.message, 'error');
      }
  } finally {
      hideLoading();
  }
}

// Load food entries from Appwrite for a given date
async function loadFoodEntries(date: Date) {
  if (!currentUser) return;

  showLoading();

  try {
    const entries = await AppwriteDB.getFoodEntries(date);
    
    getDivById('foodCardsContainer').innerHTML = '';
    
    // Add each entry to table
    entries.forEach(entry => {
      const foodData: FoodStorage = {
        id: entry.$id,
        name: entry.name,
        grams: entry.grams,
        calories: entry.calories,
        protein: entry.protein,
        fat: entry.fat,
        carbs: entry.carbs,
        fiber: entry.fiber,
        time: entry.time,
        date: entry.date,
        alkaline: entry.alkaline,
      };

      addFoodToView(foodData, entry.$id);
    });

    if (entries.length === 0) {
      getDivById('foodCardsContainer').innerHTML = `
          <div class="empty-state">
              <div class="empty-state-icon">🍽️</div>
              <div>No food items logged yet.</div>
              <div style="margin-top: 8px; font-size: 14px; opacity: 0.7;">Add your first item to get started!</div>
          </div>
      `;
    }

    setupEditAndDeleteEvents();    
    updateTotalCalories();

    // Update counters
    let totalCalories = 0;
    let totalProtein = 0;
    let totalFat = 0;
    let totalCarbs = 0;
    let totalFiber = 0;

    entries.forEach(entry => {
      totalCalories += entry.calories;
      totalProtein += entry.protein;
      totalFat += entry.fat;
      totalCarbs += entry.carbs;
      totalFiber += entry.fiber;
    });

    getDivById('proteinValue').textContent = (Math.round(totalProtein * 10) / 10).toString();
    getDivById('fatValue').textContent = (Math.round(totalFat * 10) / 10).toString();
    getDivById('carboValue').textContent = (Math.round(totalCarbs * 10) / 10).toString();
    getDivById('fiberValue').textContent = (Math.round(totalFiber * 10) / 10).toString();

    // Update goals
    const settings = await AppwriteDB.getUserSettings();
    const hasGoals = Array.isArray(settings) && settings.length > 0;
    if (hasGoals) {
      const index = settings.length - 1;
      getDivById('caloriesGoalText').classList.add('hidden');
      if (parseInt(settings[index].caloriesGoal) > 0) {
        getDivById('caloriesGoalText').textContent = `of ${settings[index].caloriesGoal}`;
        getDivById('caloriesGoalText').classList.remove('hidden');
      }

      getDivById('proteinGoalText').classList.add('hidden');
      if (parseInt(settings[index].proteinGoal) > 0) {
        getDivById('proteinGoalText').textContent = `of ${settings[index].proteinGoal}`;
        getDivById('proteinGoalText').classList.remove('hidden');
      }

      getDivById('fatGoalText').classList.add('hidden');
      if (parseInt(settings[index].fatGoal) > 0) {
        getDivById('fatGoalText').textContent = `of ${settings[index].fatGoal}`;
        getDivById('fatGoalText').classList.remove('hidden');
      }

      getDivById('carboGoalText').classList.add('hidden');
      if (parseInt(settings[index].carboGoal) > 0) {
        getDivById('carboGoalText').textContent = `of ${settings[index].carboGoal}`;
        getDivById('carboGoalText').classList.remove('hidden');
      }

      getDivById('fiberGoalText').classList.add('hidden');
      if (parseInt(settings[index].fiberGoal) > 0) {
        getDivById('fiberGoalText').textContent = `of ${settings[index].fiberGoal}`;
        getDivById('fiberGoalText').classList.remove('hidden');
      }
    } else {
      getDivById('proteinGoalText').classList.add('hidden');
      getDivById('fatGoalText').classList.add('hidden');
      getDivById('carboGoalText').classList.add('hidden');
      getDivById('fiberGoalText').classList.add('hidden');
    }
  } catch (error) {
      console.error('Load food entries error:', error);
      if (error instanceof Error) {
        swal('Oh no!', 'Failed to load food entries: ' + error.message, 'error');
      }
  } finally {
      hideLoading();
  }
}

// Handle food deletion
async function handleDeleteFood(documentId: string) {
  if (!documentId) return;

  const willDelete = await swal({
    title: "Are you sure?",
    text: 'You want to delete this food entry?',
    icon: 'warning',
    dangerMode: true,
    closeOnEsc: true,
    buttons:["No, abort", "Yes, Do it!"],
  });
  
  if (!willDelete) return;
  
  showLoading();
  
  try {
    // Delete from Appwrite
    await AppwriteDB.deleteFoodEntry(documentId);

    // Delete from monthly total
    const monthlyDocumentId = getDocumentIdForToday();
    if (monthlyDocumentId?.documentId) {
      // find calories from document
      const targetDiv = document.querySelector(`.food-card[data-id="${documentId}"]`);
      let existingToDelete = 0;
      if (targetDiv) {
        const divCalories = targetDiv.querySelectorAll('.calories-display');
        if (divCalories && divCalories.length > 0) {
          existingToDelete = parseInt(divCalories[0].innerHTML.replace(' cal', ''));
        }
      }
      const totalCalories = monthlyDocumentId?.totalCalories - existingToDelete;
      const monthlyCreated = await AppwriteDB.updateMonthlyCaloryForDay(monthlyDocumentId?.documentId, selectedDate, totalCalories);
      updateDocumentIdForToday(monthlyCreated.$id, monthlyCreated.totalCalories);
      await delay(QUICK_DELAY);
    }
    
    selectDate(selectedDate);
  } catch (error) {
    console.error('Delete food error:', error);
    if (error instanceof Error) {
      swal('Oh no!', 'Failed to delete food entry: ' + error.message, 'error');
    }
  } finally {
    hideLoading();
  }
}

function addFoodToView(foodData: FoodStorage, documentId: string) {
  // New Food card
  const container = getDivById('foodCardsContainer');
  const card = document.createElement('div');
  card.className = 'food-card';
  card.setAttribute('data-id', documentId);

  if (container.innerHTML.includes('empty-state')) {
    container.innerHTML = '';
  }

  const foodFromDatabase = getFoodItemByName(foodData.name);
  const isAlkalineStr = foodFromDatabase.info.alkaline ? ' (Alk)' : ' (Not Alk)';

  card.innerHTML = `
    <div class="card-header card-header-toggle">
      <div class="card-main-info">
          <div class="food-name-time">
            <div class="food-name">${foodData.name}</div>
            <div class="food-time">${foodData.time || new Date().toLocaleTimeString()} • ${foodData.grams}g</div>
          </div>
          <div class="calories-display">${foodData.calories} cal</div>
      </div>
      <div class="expand-icon">▼</div>
    </div>
    <div class="card-details">
      <div class="details-content">
          <div class="nutrition-grid">
            <div class="nutrition-item">
                <div class="nutrition-label">Protein</div>
                <div class="nutrition-value">${foodData.protein}g</div>
            </div>
            <div class="nutrition-item">
                <div class="nutrition-label">Fat</div>
                <div class="nutrition-value">${foodData.fat}g</div>
            </div>
            <div class="nutrition-item">
                <div class="nutrition-label">Carbs</div>
                <div class="nutrition-value">${foodData.carbs}g</div>
            </div>
            <div class="nutrition-item">
                <div class="nutrition-label">Fiber</div>
                <div class="nutrition-value">${foodData.fiber}g</div>
            </div>
            <div class="food-is-alkaline hidden">${foodData.alkaline ? 'alkaline' : ''}</div>
          </div>
          <div class="card-actions">
            <span class="muted">${foodFromDatabase.info.category} ${isAlkalineStr}</span>
            <div>
              <button class="btn btn-copy" data-food-id="${documentId}">Copy</button>
              <button class="btn btn-edit" data-food-id="${documentId}">Edit</button>
              <button class="btn btn-delete" data-food-id="${documentId}">Delete</button>
            </div>
          </div>
      </div>
    </div>
  `;

  container?.appendChild(card);

  setupEditAndDeleteEvents();
}

// Update total calories and display it in the counter
// Also updates alkaline level percentage
function updateTotalCalories() {
  const caloriesDiv = document.querySelectorAll('.calories-display');
  let total = 0;

  caloriesDiv.forEach((innerDiv: Element) => {
    total += parseInt(innerDiv.innerHTML.replace(' cal', '')) || 0;
  });

  getDivById('caloriesCounter').textContent = total.toString();
  // Update alkaline level
  const gramsDivs = document.querySelectorAll('.food-time');
  let totalGrams = 0;
  let indexMap: {index: number, grams: number}[] = [];
  gramsDivs.forEach((innerDiv: Element, key: number) => {
    const totalGramDiv = parseInt(innerDiv.innerHTML.split(' ')[2].replace('g', ''));
    totalGrams += totalGramDiv || 0;
    indexMap.push({
      index: key,
      grams: totalGramDiv || 0
    });
  });

  const alkalineDivs = document.querySelectorAll('.food-is-alkaline');
  let totalAlkaline = 0;
  alkalineDivs.forEach((alkaDiv: Element, key: number) => {
    if (alkaDiv.innerHTML === 'alkaline') {
      for (let ob of indexMap) {
        if (ob.index === key) {
          totalAlkaline += ob.grams;
          break;
        }
      }
    }
  });

  const alkalinePercent = totalAlkaline / totalGrams * 100;
  getDivById('alkaline-level').textContent = (Math.round(alkalinePercent * 10) / 10).toString() + '% Alkaline';
}

// Calendar functions
const previousMonth = () => {
  currentViewDate.setMonth(currentViewDate.getMonth() - 1);
  renderCalendar();
}

const nextMonth = () => {
  currentViewDate.setMonth(currentViewDate.getMonth() + 1);
  renderCalendar();
}

const selectDate = async (date: Date) => {
  selectedDate = date;
  updateCurrentDate();
  await loadFoodEntries(date);
  await fetchCaloriesCurrentMonth();
  renderCalendar();
}

const renderCalendar = async () => {
  const year = currentViewDate.getFullYear();
  const month = currentViewDate.getMonth();
  
  // Update calendar title
  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December'
  ];
  getDivById('calendarTitle').textContent = `${monthNames[month]} ${year}`;
  
  // Clear calendar
  const grid = getDivById('calendarGrid');
  grid.innerHTML = '';
  
  // Add day headers
  const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  dayHeaders.forEach(day => {
    const header = document.createElement('div');
    header.className = 'calendar-day-header';
    header.textContent = day;
    grid.appendChild(header);
  });
  
  // Get first day of month and number of days
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay();
  
  // Add empty cells for previous month
  const prevMonth = new Date(year, month, 0);
  const daysInPrevMonth = prevMonth.getDate();
  
  for (let i = startingDayOfWeek - 1; i >= 0; i--) {
    const day = daysInPrevMonth - i;
    const dayElement = createDayElement(day, true, year, month - 1, 0);
    grid.appendChild(dayElement);
  }
  
  // Add days of current month
  for (let day = 1; day <= daysInMonth; day++) {
    // New rule starting October 31st, 2025
    let adjustedDay = day;
    if (currentViewDate >= new Date('2025-10-31')) {
      adjustedDay = day + (month + 1) + year;
    }
    const dayCalories = getDocumentIdForDay(adjustedDay);
    const dayElement = createDayElement(day, false, year, month, dayCalories);
    grid.appendChild(dayElement);
  }
  
  // Add days from next month to fill the grid
  const totalCells = grid.children.length - 7;
  const remainingCells = 42 - totalCells;
  
  for (let day = 1; day <= remainingCells; day++) {
    const dayElement = createDayElement(day, true, year, month + 1, 0);
    grid.appendChild(dayElement);
  }
}

function createDayElement(day: number, isOtherMonth: boolean, year: number, month: number, calories: number) {
  const dayElement = document.createElement('div') as HTMLElement;
  dayElement.className = 'calendar-day';
  
  const dayDate = new Date(year, month, day);
  const dateString = dayDate.toISOString().split('T')[0];
  
  if (isOtherMonth) {
    dayElement.classList.add('other-month');
  } else {
    dayElement.onclick = () => selectDate(dayDate);
  }
  
  // Check if this is today
  const today = new Date().toISOString().split('T')[0];
  if (!isOtherMonth && dateString === today) {
    dayElement.classList.add('today');
  }
  
  // Check if this is selected date
  if (!isOtherMonth && dateString === selectedDate.toISOString().split('T')[0]) {
    dayElement.classList.add('selected');
  }
  
  // Check if this day has data
  if (calories > 0) {
    dayElement.innerHTML = `
      ${day}
      <small class="muted">${calories}</small>
    `;
  } else {
    dayElement.textContent = day.toString();
  }
  
  return dayElement;
}

// Share functionality
async function handleShareClick() {
  if (!currentUser) {
    swal('Hey!', 'Please log in to share your food log.', 'info');
    return;
  }

  if (appState.isSharedView) {
    swal('Info', 'You cannot share a shared view.', 'info');
    return;
  }

  closeMobileMenu();
  showLoading();

  try {
    // Get current day's food entries
    const entries = await AppwriteDB.getFoodEntries(selectedDate);

    if (entries.length === 0) {
      hideLoading();
      swal('Info', 'No food entries to share for this day.', 'info');
      return;
    }

    // Convert entries to FoodStorage format
    const foodEntries: FoodStorage[] = entries.map(entry => ({
      name: entry.name,
      grams: entry.grams,
      calories: entry.calories,
      protein: entry.protein,
      fat: entry.fat,
      carbs: entry.carbs,
      fiber: entry.fiber,
      time: entry.time,
      date: entry.date,
      alkaline: entry.alkaline,
    }));

    // Create shared day snapshot
    const sharedDay = await AppwriteDB.createSharedDay(selectedDate, foodEntries);

    // Generate share URL
    const shareUrl = `${window.location.origin}${window.location.pathname}?share=${sharedDay.shareId}`;

    // Show modal with link
    getInputById('share-link-input').value = shareUrl;
    getDivById('share-modal').classList.remove('hidden');

    hideLoading();
  } catch (error) {
    hideLoading();
    console.error('Share error:', error);
    if (error instanceof Error) {
      swal('Oh no!', 'Failed to create share link: ' + error.message, 'error');
    }
  }
}

function closeShareModal() {
  getDivById('share-modal').classList.add('hidden');
}

async function copyShareLink() {
  const shareInput = getInputById('share-link-input');

  try {
    await navigator.clipboard.writeText(shareInput.value);
    const copyBtn = document.getElementById('copy-share-link');
    if (copyBtn) {
      const originalText = copyBtn.textContent;
      copyBtn.textContent = 'Copied!';
      setTimeout(() => {
        copyBtn.textContent = originalText;
      }, 2000);
    }
  } catch (error) {
    console.error('Copy error:', error);
    swal('Oh no!', 'Failed to copy link to clipboard', 'error');
  }
}

// Check for share parameter on page load
async function checkSharedView() {
  const urlParams = new URLSearchParams(window.location.search);
  const shareId = urlParams.get('share');

  if (shareId) {
    showLoading();

    try {
      const sharedDay = await AppwriteDB.getSharedDay(shareId);

      // Set shared view mode
      appState.isSharedView = true;
      appState.sharedData = {
        shareId: sharedDay.shareId,
        userId: sharedDay.userId,
        userName: sharedDay.userName,
        date: sharedDay.date,
        foodEntries: sharedDay.foodEntries,
        createdAt: sharedDay.createdAt
      };

      // Parse the date and set as selected date (as local date, not UTC)
      const [year, month, day] = sharedDay.date.split('-').map(Number);
      selectedDate = new Date(year, month - 1, day);
      currentViewDate = new Date(year, month - 1, day);

      // Show shared view banner
      const banner = getDivById('shared-view-banner');
      banner.classList.remove('hidden');
      getDivById('shared-user-name').textContent = sharedDay.userName;
      getDivById('shared-date').textContent = selectedDate.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      // Hide auth section and show app content
      getDivById('auth-buttons').classList.add('hidden');
      getDivById('user-info').classList.add('hidden');
      getDivById('app-content').classList.remove('hidden');

      // Render shared day view
      renderSharedDayView();

      // Apply read-only mode
      applyReadOnlyMode();

      hideLoading();
    } catch (error) {
      hideLoading();
      console.error('Load shared day error:', error);
      swal('Oh no!', 'Failed to load shared day: ' + (error instanceof Error ? error.message : 'Unknown error'), 'error');
    }
  }
}

function renderSharedDayView() {
  if (!appState.sharedData) return;

  updateCurrentDate();

  // Parse food entries
  const foodEntries: FoodStorage[] = JSON.parse(appState.sharedData.foodEntries);

  // Clear container
  getDivById('foodCardsContainer').innerHTML = '';

  // Add each entry to view
  foodEntries.forEach((entry, index) => {
    addFoodToView(entry, `shared-${index}`);
  });

  // Calculate and display totals
  let totalCalories = 0;
  let totalProtein = 0;
  let totalFat = 0;
  let totalCarbs = 0;
  let totalFiber = 0;

  foodEntries.forEach(entry => {
    totalCalories += entry.calories;
    totalProtein += entry.protein;
    totalFat += entry.fat;
    totalCarbs += entry.carbs;
    totalFiber += entry.fiber;
  });

  getDivById('caloriesCounter').textContent = totalCalories.toString();
  getDivById('proteinValue').textContent = (Math.round(totalProtein * 10) / 10).toString();
  getDivById('fatValue').textContent = (Math.round(totalFat * 10) / 10).toString();
  getDivById('carboValue').textContent = (Math.round(totalCarbs * 10) / 10).toString();
  getDivById('fiberValue').textContent = (Math.round(totalFiber * 10) / 10).toString();

  // Update alkaline level
  updateTotalCalories();

  renderCalendar();
}

function applyReadOnlyMode() {
  // Hide add food section
  const addFoodSection = document.querySelector('.add-food-section');
  if (addFoodSection) {
    addFoodSection.classList.add('read-only-disabled');
  }

  // Hide edit/delete/copy buttons
  const actionButtons = document.querySelectorAll('.card-actions button');
  actionButtons.forEach(button => {
    (button as HTMLElement).style.display = 'none';
  });

  // Hide calendar navigation
  const calendarSection = document.querySelector('.calendar-section');
  if (calendarSection) {
    calendarSection.classList.add('read-only-disabled');
  }
}

(window as any).selectFood = selectFood;
