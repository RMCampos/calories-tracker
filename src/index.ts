import { foodDatabase } from './foodDatabase.js';
import { getButtonById, getButtonListByClassName, getDivById, getInputById, showFoodPreview } from './HtmlUtil.ts';
import { FoodItem, FoodStorage } from './types.js';
import { AppwriteAuth, AppwriteDB } from './appwrite.js';
import swal from 'sweetalert';

// App state
let selectedDate = new Date();
let currentViewDate = new Date();

// Authentication state
let currentUser: any | null = null;

// DOM Elements
const authSection = document.getElementById('auth-section');
const userInfo = document.getElementById('user-info');
const appContent = document.getElementById('app-content');
const settingsContent = document.getElementById('settings-content');
const loadingOverlay = getDivById('loading-overlay');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');

// Initialize when page loads
document.addEventListener('DOMContentLoaded', async function() {
  await initializeAuth();
  populateFoodSelect();
  updateCurrentDate();
  setupEventListeners();
});

// Initialize application
async function initializeAuth() {
  showLoading();
  
  try {
    // Check if user is already logged in
    const isLoggedIn = await AppwriteAuth.isLoggedIn();
    
    if (isLoggedIn) {
      currentUser = await AppwriteAuth.getCurrentUser();
      showMainApp();
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

// Toggle between login and register forms
function toggleAuthForms() {
  loginForm?.classList.toggle('hidden');
  registerForm?.classList.toggle('hidden');
  
  // Clear form data
  const logForm = document.getElementById('loginForm') as HTMLFormElement;
  logForm.reset();

  const resetForm = document.getElementById('registerForm') as HTMLFormElement;
  resetForm.reset();
}

// Handle user registration
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
    
    showMainApp();
    selectDate(selectedDate);
    
    swal('Registration successful! Welcome to Food Tracker.');
  } catch (error) {
    console.error('Registration error:', error);
    swal('Oh no!', 'Registration failed: ' + error.message, 'error');
  } finally {
    hideLoading();
  }
}

// Handle user login
async function handleLogin(e: SubmitEvent) {
  e.preventDefault();
  showLoading();

  const email = getInputById('loginEmail').value;
  const password = getInputById('loginPassword').value;

  try {
    await AppwriteAuth.login(email, password);
    currentUser = await AppwriteAuth.getCurrentUser();
    
    showMainApp();
    selectDate(selectedDate);
      
  } catch (error) {
    console.error('Login error:', error);
    swal('Oh no!', 'Login failed: ' + error.message, 'error');
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

// Example usage with API calls
interface ResponseItem {
  id: string;
  data: string;
}
async function fetchItemDetails(item: ResponseItem): Promise<any> {
  const response = await fetch(`/api/items/${item.id}`);
  return response.json();
}

// Main function that processes the response
async function handleResponse(response: ResponseItem[]): Promise<void> {
  try {
    // This creates and executes all promises concurrently
    const results = await processResponseItems(response, fetchItemDetails);
    
    console.log('All requests completed:', results);
  } catch (error) {
    console.error('One or more requests failed:', error);
  }
}

async function handleSaveSettings(e: SubmitEvent) {
  e.preventDefault();
  showLoading();

  try {
    const proteinGoal = getInputById('proteinGoal').value;
    const fatGoal = getInputById('fatGoal').value;
    const carboGoal = getInputById('carboGoal').value;
    const fiberGoal = getInputById('fiberGoal').value;

    // Delete existing settings - keep only the new one
    const documents = await AppwriteDB.getUserSettings();
    const promises = [];
    for (let i=0; i<documents.length; i++) {
      // keep going from here, the promises
    }

    // Save to Appwrite
    await AppwriteDB.saveUserSettings({
      proteinGoal: parseInt(proteinGoal),
      fatGoal: parseInt(fatGoal),
      carboGoal: parseInt(carboGoal),
      fiberGoal: parseInt(fiberGoal),
    });

    hideLoading();
    handleSettings();
    selectDate(selectedDate);
  } catch (error) {
    hideLoading();
    console.error('Saving error:', error);
    swal('Oh no!', 'Saving failed: ' + error.message, 'error');
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
    swal('Oh no!', 'Logout failed: ' + error.message, 'error');
  }
}

async function handleSettings() {
  const showSettings = getButtonById('settingsBtn').textContent === 'Settings';

  if (showSettings) {
    showLoading();

    try {
      // Fetch goals from settings
      const settings = await AppwriteDB.getUserSettings();
      const hasGoals = Array.isArray(settings) && settings.length > 0;
      if (hasGoals) {
        const index = settings.length - 1;
        getInputById('proteinGoal').value = settings[index].proteinGoal;
        getInputById('fatGoal').value = settings[index].fatGoal;
        getInputById('carboGoal').value = settings[index].carboGoal;
        getInputById('fiberGoal').value = settings[index].fiberGoal;
      } else {
        getInputById('proteinGoal').value = '';
        getInputById('fatGoal').value = '';
        getInputById('carboGoal').value = '';
        getInputById('fiberGoal').value = '';
      }
      
      getButtonById('settingsBtn').textContent = 'Back to App';

      appContent?.classList.add('hidden');
      settingsContent?.classList.remove('hidden');
      hideLoading();
    } catch (error) {
      hideLoading();
      console.error('Fetching settings failed:', error);
      swal('Oh no!', 'Fetching settings failed: ' + error.message, 'error');
    }
  }
  else {
    appContent?.classList.remove('hidden');
    settingsContent?.classList.add('hidden');
    getButtonById('settingsBtn').textContent = 'Settings';
  }
}

// Show authentication forms
function showAuthForms() {
  authSection?.classList.remove('hidden');
  userInfo?.classList.add('hidden');
  appContent?.classList.add('hidden');
}

function showMainApp() {
  authSection?.classList.add('hidden');
  userInfo?.classList.remove('hidden');
  appContent?.classList.remove('hidden');
    
  // Update user info display
  if (currentUser) {
    getDivById('userName').textContent = `Welcome, ${currentUser.name}!`;
  }
    
  // Update date display
  updateCurrentDate();
}

// Show/hide loading overlay
function showLoading() {
  loadingOverlay.classList.remove('hidden');
}

function hideLoading() {
  loadingOverlay.classList.add('hidden');
}

// Clear application data
function clearAppData() {
  getDivById('foodTableBody').innerHTML = '';
  getDivById('caloriesCounter').textContent = '0';
  getInputById('foodSelect').value = '';
  getInputById('gramAmount').value = '100';
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
      fiber: Math.round(foodData.info.fiber * multiplier * 10) / 10
    }
  };
}

const getFoodItemByName = (foodName: string): FoodItem => {
  const foodDataSearch: FoodItem[] = foodDatabase.filter(f => f.name === foodName);
  if (foodDataSearch.length === 0) {
    throw new Error(`Food not found for name ${name}`);
  }
  return foodDataSearch[0];
}

const previewCalories = () => {
  const foodSelect = getInputById('foodSelect');
  const gramAmount = getInputById('gramAmount');
  
  if (!foodSelect.value) {
    showFoodPreview(false);
    return;
  }

  let grams = 100;
  if (gramAmount && gramAmount.value && parseFloat(gramAmount.value) > 0) {
    grams = parseFloat(gramAmount.value);
  }

  const foodData: FoodItem = getFoodItemByName(foodSelect.value);
  const proportion = getFoodData(grams, foodData);

  getDivById('calorieValuePreview').textContent = proportion.info.calories.toString();
  getDivById('proteinValuePreview').textContent = (Math.round(proportion.info.protein * 10) / 10).toString ();
  getDivById('fatValuePreview').textContent = (Math.round(proportion.info.fat * 10) / 10).toString ();
  getDivById('carboValuePreview').textContent = (Math.round(proportion.info.carbs * 10) / 10).toString ();
  getDivById('fiberValuePreview').textContent = (Math.round(proportion.info.fiber * 10) / 10).toString ();

  showFoodPreview(true);
}

const setupEventListeners = () => {
  getInputById('foodSelect').addEventListener('change', () => {
    previewCalories();
  });

  getInputById('gramAmount').addEventListener('change', () => {
    previewCalories();
  });

  getButtonById('add-food-btn').addEventListener('click', () => {
    addFood();
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

  // Auth forms
  document.getElementById('loginForm')?.addEventListener('submit', handleLogin);
  document.getElementById('registerForm')?.addEventListener('submit', handleRegister);
  document.getElementById('logoutBtn')?.addEventListener('click', handleLogout);
  document.getElementById('settingsBtn')?.addEventListener('click', handleSettings);
  document.getElementById('settingsForm')?.addEventListener('submit', handleSaveSettings);
}

const addDeleteEvents = () => {
  const elements = getButtonListByClassName('delete-food-entry');
  Array.from(elements).forEach((el: HTMLButtonElement) => {
    el.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      const row = target.closest('tr');
      const entryId = row?.querySelector('.hidden-column')?.textContent;
      if (entryId && row) {
        handleDeleteFood(entryId, row);
      }
    });
  });
}

// Populate food select dropdown
const populateFoodSelect = () => {
  const select = getInputById('foodSelect');
  select.innerHTML = '<option value="">Select a food item...</option>';
    
  const sortedFoods = foodDatabase.sort((f1, f2) => f1.name.localeCompare(f2.name));
  sortedFoods.forEach((food: FoodItem) => {
    const option = document.createElement('option') as HTMLOptionElement;
    option.value = food.name;
    option.textContent = food.name;
    select.appendChild(option);
  });
}

// Update current date display
const updateCurrentDate = () => {
  const date = new Date(selectedDate);
  getDivById('currentDate').textContent = date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

// Add food to the log
const addFood = async () => {
  if (!currentUser) {
    swal('Hey!', 'Please log in to add food entries.', 'info');
    return;
  }

  const foodSelect = getInputById('foodSelect');
  const gramAmount = getInputById('gramAmount');
    
  if (!foodSelect.value || !gramAmount.value) {
    swal('Hey!', 'Please select a food item and enter amount', 'error');
    return;
  }

  showLoading();

  try {
    const grams: number = parseFloat(gramAmount.value);
    const foodData: FoodItem = getFoodItemByName(foodSelect.value);

    // Calculate nutrition for the amount
    const proportion: FoodItem = getFoodData(grams, foodData);
    const entry: FoodStorage = {
      name: foodSelect.value,
      grams: grams,
      calories: proportion.info.calories,
      protein: proportion.info.protein,
      fat: proportion.info.fat,
      carbs: proportion.info.carbs,
      fiber: proportion.info.fiber,
      date: selectedDate.toISOString().split('T')[0],
      time: new Date().toLocaleTimeString('en-US', { 
        hour12: false, 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    };

    // Save to Appwrite
    const savedEntry = await AppwriteDB.saveFoodEntry(entry);

    // Add to HTML table with Appwrite document ID
    addFoodToTable(entry, savedEntry.$id);

    // Update totals
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
    foodSelect.value = '';
    gramAmount.value = '100';
    showFoodPreview(false);
  } catch (error) {
      console.error('Add food error:', error);
      swal('Oh no!', 'Failed to add food entry: ' + error.message, 'error');
  } finally {
      hideLoading();
  }
}

// Load food entries from Appwrite
async function loadFoodEntries(date: Date) {
  if (!currentUser) return;

  showLoading();

  try {
    const entries = await AppwriteDB.getFoodEntries(date);
    
    // Clear current table
    getDivById('foodTableBody').innerHTML = '';
    
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
      };
      
      addFoodToTable(foodData, entry.$id);
    });

    // Setup Delete events
    addDeleteEvents();
    
    // Update total calories
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
      swal('Oh no!', 'Failed to load food entries: ' + error.message, 'error');
  } finally {
      hideLoading();
  }
}

// Handle food deletion
async function handleDeleteFood(documentId: string, row: HTMLTableRowElement) {
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
    
    selectDate(selectedDate);
      
  } catch (error) {
    console.error('Delete food error:', error);
    swal('Oh no!', 'Failed to delete food entry: ' + error.message, 'error');
  } finally {
    hideLoading();
  }
}

// Add food to table (existing function - update to use document ID)
function addFoodToTable(foodData: FoodStorage, documentId: string) {
  const tableBody = document.getElementById('foodTableBody');
  const row = document.createElement('tr');
  
  row.innerHTML = `
      <td class="hidden-column">${documentId}</td>
      <td>${foodData.time || new Date().toLocaleTimeString()}</td>
      <td>${foodData.name}</td>
      <td>${foodData.grams}</td>
      <td>${foodData.calories}</td>
      <td>${foodData.protein}</td>
      <td>${foodData.fat}</td>
      <td>${foodData.carbs}</td>
      <td>${foodData.fiber}</td>
      <td><button class="delete-btn delete-food-entry">Delete</button></td>
  `;
  
  tableBody?.appendChild(row);

  // Setup Delete events
  addDeleteEvents();
}

// Update total calories
function updateTotalCalories() {
  const caloriesCells = document.querySelectorAll('#foodTableBody td:nth-child(5)'); // 5th column is calories
  let total = 0;
  
  caloriesCells.forEach((cell: Element) => {
      total += parseInt(cell.innerHTML) || 0;
  });
  
  getDivById('caloriesCounter').textContent = total.toString();
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
  renderCalendar();
}

const renderCalendar = () => {
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
    const dayElement = createDayElement(day, true, year, month - 1);
    grid.appendChild(dayElement);
  }
  
  // Add days of current month
  for (let day = 1; day <= daysInMonth; day++) {
    const dayElement = createDayElement(day, false, year, month);
    grid.appendChild(dayElement);
  }
  
  // Add days from next month to fill the grid
  const totalCells = grid.children.length - 7;
  const remainingCells = 42 - totalCells;
  
  for (let day = 1; day <= remainingCells; day++) {
    const dayElement = createDayElement(day, true, year, month + 1);
    grid.appendChild(dayElement);
  }
}

function createDayElement(day: number, isOtherMonth: boolean, year: number, month: number) {
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
  const dayData = []; // FIXME get from AppWrite
  if (dayData.length > 0) {
    dayElement.classList.add('has-data');
    const totalCalories = 0; // dayData.reduce((sum, entry) => sum + entry.calories, 0);
    
    dayElement.innerHTML = `
        <div>${day}</div>
        <div class="day-calories">${totalCalories} cal</div>
    `;
  } else {
    dayElement.textContent = day.toString();
  }
  
  return dayElement;
}


