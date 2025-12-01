import { foodDatabase } from './foodDatabase.js';
import { getButtonById, getDivById, getInputById, showFoodPreview } from './DomUtils.ts';
import { FoodItem, MealType, PlannedFoodItem } from './types.js';
import { AppwriteDB } from './appwrite.js';
import swal from 'sweetalert';
import { hideLoading, showLoading, getCleanName, getIcon } from './Utils.ts';
import { appState } from "./state";

let selectedPlanFood: FoodItem | null = null;
let currentMealType: MealType | null = null;

// Navigation functions
export async function toggleMealPlannerView() {
  const showMealPlanner = getButtonById('mealPlannerBtn').textContent?.includes('Meal Planner');

  if (showMealPlanner) {
    showLoading();

    try {
      // Load templates
      await loadMealPlanTemplates();

      // Load active template if exists
      const activeTemplate = await AppwriteDB.getActiveMealPlanTemplate();
      if (activeTemplate) {
        appState.currentTemplate = activeTemplate as any;
        await loadPlannedItemsForTemplate(activeTemplate.$id);
      }

      // Show meal planner page
      getDivById('app-content').classList.add('hidden');
      getDivById('settings-content').classList.add('hidden');
      getDivById('meal-planner-content').classList.remove('hidden');
      getButtonById('mealPlannerBtn').textContent = '← Back';
      getButtonById('mealPlannerBtnMobile').textContent = '← Back';
      hideLoading();
    } catch (error) {
      hideLoading();
      console.error('Show meal planner error:', error);
      if (error instanceof Error) {
        swal('Oh no!', 'Failed to load meal planner: ' + error.message, 'error');
      }
    }
  } else {
    // Go back to main app
    getDivById('app-content').classList.remove('hidden');
    getDivById('meal-planner-content').classList.add('hidden');
    getButtonById('mealPlannerBtn').textContent = '📋 Meal Planner';
    getButtonById('mealPlannerBtnMobile').textContent = '📋 Meal Planner';
  }
}

export function handleMobileMealPlannerClick() {
  toggleMealPlannerView();
  // Close mobile menu
  const mobileMenu = document.getElementById('mobileMenu');
  if (mobileMenu) {
    mobileMenu.classList.add('hidden');
  }
}

// Template management functions
export async function loadMealPlanTemplates() {
  try {
    const templates = await AppwriteDB.getMealPlanTemplates();
    const templateSelector = document.getElementById('templateSelector') as HTMLSelectElement;

    if (!templateSelector) return;

    // Clear existing options except the first one
    templateSelector.innerHTML = '<option value="">-- Select a plan --</option>';

    // Add templates
    templates.forEach(template => {
      const option = document.createElement('option');
      option.value = template.$id;
      option.textContent = template.name;
      if (template.isActive) {
        option.selected = true;
      }
      templateSelector.appendChild(option);
    });
  } catch (error) {
    console.error('Load templates error:', error);
    throw error;
  }
}

export async function createNewTemplate() {
  const templateName = await swal({
    title: 'New Meal Plan',
    text: 'Enter a name for your meal plan:',
    content: {
      element: 'input',
      attributes: {
        placeholder: 'e.g., Workout Day, Rest Day',
        type: 'text',
      },
    },
    buttons: {
      cancel: true,
      confirm: true,
    },
  });

  if (!templateName || templateName.trim() === '') {
    return;
  }

  showLoading();

  try {
    const newTemplate = await AppwriteDB.createMealPlanTemplate(templateName.trim());
    await loadMealPlanTemplates();

    // Set as active and load it
    await AppwriteDB.setActiveMealPlanTemplate(newTemplate.$id);
    appState.currentTemplate = newTemplate as any;
    appState.plannedItems = [];

    // Update selector
    const templateSelector = document.getElementById('templateSelector') as HTMLSelectElement;
    if (templateSelector) {
      templateSelector.value = newTemplate.$id;
    }

    // Refresh display
    displayPlannedItems();
    updatePlanTotals();

    hideLoading();
    swal('Success!', 'Meal plan created successfully!', 'success');
  } catch (error) {
    hideLoading();
    console.error('Create template error:', error);
    if (error instanceof Error) {
      swal('Oh no!', 'Failed to create meal plan: ' + error.message, 'error');
    }
  }
}

export async function deleteCurrentTemplate() {
  if (!appState.currentTemplate) {
    swal('Oh no!', 'No meal plan selected', 'error');
    return;
  }

  const confirm = await swal({
    title: 'Delete Meal Plan',
    text: `Are you sure you want to delete "${appState.currentTemplate.name}"? This will also delete all planned items.`,
    icon: 'warning',
    buttons: {
      cancel: true,
      confirm: {
        text: 'Delete',
        value: true,
      },
    },
    dangerMode: true,
  });

  if (!confirm) {
    return;
  }

  showLoading();

  try {
    await AppwriteDB.deleteMealPlanTemplate(appState.currentTemplate.id!);
    appState.currentTemplate = null;
    appState.plannedItems = [];

    await loadMealPlanTemplates();
    displayPlannedItems();
    updatePlanTotals();

    hideLoading();
    swal('Success!', 'Meal plan deleted successfully!', 'success');
  } catch (error) {
    hideLoading();
    console.error('Delete template error:', error);
    if (error instanceof Error) {
      swal('Oh no!', 'Failed to delete meal plan: ' + error.message, 'error');
    }
  }
}

export async function handleTemplateChange(templateId: string) {
  if (!templateId) {
    appState.currentTemplate = null;
    appState.plannedItems = [];
    displayPlannedItems();
    updatePlanTotals();
    return;
  }

  showLoading();

  try {
    // Set as active template
    await AppwriteDB.setActiveMealPlanTemplate(templateId);

    // Load template details
    const templates = await AppwriteDB.getMealPlanTemplates();
    const template = templates.find(t => t.$id === templateId);

    if (template) {
      appState.currentTemplate = template as any;
      await loadPlannedItemsForTemplate(templateId);
    }

    hideLoading();
  } catch (error) {
    hideLoading();
    console.error('Handle template change error:', error);
    if (error instanceof Error) {
      swal('Oh no!', 'Failed to load meal plan: ' + error.message, 'error');
    }
  }
}

async function loadPlannedItemsForTemplate(templateId: string) {
  try {
    const items = await AppwriteDB.getPlannedItemsByTemplate(templateId);
    appState.plannedItems = items as any[];
    displayPlannedItems();
    updatePlanTotals();
  } catch (error) {
    console.error('Load planned items error:', error);
    throw error;
  }
}

// Food search and add functions
export function setupPlanFoodSearch() {
  const searchInput = document.getElementById('planFoodSearchInput') as HTMLInputElement;
  const gramAmountInput = document.getElementById('planGramAmount') as HTMLInputElement;

  if (!searchInput || !gramAmountInput) return;

  searchInput.addEventListener('input', (e) => {
    const target = e.target as HTMLInputElement;
    const searchTerm = target.value.trim().toLowerCase();

    if (searchTerm === '') {
      hidePlanSearchResults();
      selectedPlanFood = null;
      return;
    }

    // Debounce search
    if (appState.planSearchTimeout) {
      clearTimeout(appState.planSearchTimeout);
    }

    appState.planSearchTimeout = window.setTimeout(() => {
      performPlanFoodSearch(searchTerm);
    }, 300);
  });

  searchInput.addEventListener('keydown', (e) => {
    navigatePlanResultsKeyboard(e as KeyboardEvent);
  });

  gramAmountInput.addEventListener('input', () => {
    previewPlanCalories();
  });
}

function performPlanFoodSearch(searchTerm: string) {
  const results = foodDatabase.filter(food =>
    food.name.toLowerCase().includes(searchTerm)
  ).slice(0, 10);

  appState.planSearchResults = results;
  appState.planCurrentHighlightIndex = -1;
  displayPlanSearchResults(results);
}

function displayPlanSearchResults(results: FoodItem[]) {
  const searchResults = document.getElementById('planSearchResults');
  if (!searchResults) return;

  if (results.length === 0) {
    searchResults.innerHTML = '<div class="no-results">No foods found</div>';
    searchResults.classList.remove('hidden');
    return;
  }

  searchResults.innerHTML = '';
  results.forEach((food, index) => {
    const resultItem = document.createElement('div');
    resultItem.className = 'search-result-item';
    resultItem.setAttribute('data-index', index.toString());
    resultItem.innerHTML = `
      ${getIcon(food.info.category)}
      <span class="food-name">${getCleanName(food.name)}</span>
      <span class="food-calories">${food.info.calories} cal</span>
    `;
    resultItem.addEventListener('click', () => selectPlanFood(food));
    searchResults.appendChild(resultItem);
  });

  searchResults.classList.remove('hidden');
}

function hidePlanSearchResults() {
  const searchResults = document.getElementById('planSearchResults');
  if (searchResults) {
    searchResults.classList.add('hidden');
    searchResults.innerHTML = '';
  }
  appState.planSearchResults = [];
  appState.planCurrentHighlightIndex = -1;
}

function navigatePlanResultsKeyboard(e: KeyboardEvent) {
  const results = appState.planSearchResults;

  if (results.length === 0) return;

  if (e.key === 'ArrowDown') {
    e.preventDefault();
    appState.planCurrentHighlightIndex = Math.min(appState.planCurrentHighlightIndex + 1, results.length - 1);
    updatePlanResultsHighlight();
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    appState.planCurrentHighlightIndex = Math.max(appState.planCurrentHighlightIndex - 1, -1);
    updatePlanResultsHighlight();
  } else if (e.key === 'Enter') {
    e.preventDefault();
    if (appState.planCurrentHighlightIndex >= 0) {
      selectPlanFood(results[appState.planCurrentHighlightIndex]);
    }
  } else if (e.key === 'Escape') {
    hidePlanSearchResults();
  }
}

function updatePlanResultsHighlight() {
  const searchResults = document.getElementById('planSearchResults');
  if (!searchResults) return;

  const items = searchResults.querySelectorAll('.search-result-item');
  items.forEach((item, index) => {
    if (index === appState.planCurrentHighlightIndex) {
      item.classList.add('highlighted');
    } else {
      item.classList.remove('highlighted');
    }
  });
}

function selectPlanFood(food: FoodItem) {
  selectedPlanFood = food;
  const searchInput = document.getElementById('planFoodSearchInput') as HTMLInputElement;
  if (searchInput) {
    searchInput.value = getCleanName(food.name);
  }
  hidePlanSearchResults();
  previewPlanCalories();
}

function previewPlanCalories() {
  const gramAmountInput = document.getElementById('planGramAmount') as HTMLInputElement;
  const previewContainer = document.getElementById('plan-food-preview');

  if (!selectedPlanFood || !gramAmountInput || !previewContainer) {
    if (previewContainer) previewContainer.classList.add('display-none');
    return;
  }

  const grams = parseFloat(gramAmountInput.value) || 100;
  const proportion = grams / 100;

  const calories = Math.round(selectedPlanFood.info.calories * proportion);
  const protein = Math.round(selectedPlanFood.info.protein * proportion * 10) / 10;
  const fat = Math.round(selectedPlanFood.info.fat * proportion * 10) / 10;
  const carbs = Math.round(selectedPlanFood.info.carbs * proportion * 10) / 10;
  const fiber = Math.round(selectedPlanFood.info.fiber * proportion * 10) / 10;

  const calorieEl = document.getElementById('planCalorieValuePreview');
  const proteinEl = document.getElementById('planProteinValuePreview');
  const fatEl = document.getElementById('planFatValuePreview');
  const carbsEl = document.getElementById('planCarboValuePreview');
  const fiberEl = document.getElementById('planFiberValuePreview');

  if (calorieEl) calorieEl.textContent = calories.toString();
  if (proteinEl) proteinEl.textContent = protein.toString();
  if (fatEl) fatEl.textContent = fat.toString();
  if (carbsEl) carbsEl.textContent = carbs.toString();
  if (fiberEl) fiberEl.textContent = fiber.toString();

  previewContainer.classList.remove('display-none');
}

export function showAddFoodToPlan(mealType: MealType) {
  if (!appState.currentTemplate) {
    swal('Oh no!', 'Please select or create a meal plan first', 'error');
    return;
  }

  currentMealType = mealType;
  const addSection = document.getElementById('addFoodToPlanSection');
  const mealTypeSpan = document.getElementById('currentMealType');
  const currentMealTypeInput = document.getElementById('currentMealTypeInput') as HTMLInputElement;

  if (addSection) addSection.classList.remove('hidden');
  if (mealTypeSpan) mealTypeSpan.textContent = mealType.charAt(0).toUpperCase() + mealType.slice(1);
  if (currentMealTypeInput) currentMealTypeInput.value = mealType;

  // Scroll to form
  addSection?.scrollIntoView({ behavior: 'smooth' });
}

export function hideAddFoodToPlan() {
  const addSection = document.getElementById('addFoodToPlanSection');
  const searchInput = document.getElementById('planFoodSearchInput') as HTMLInputElement;
  const gramInput = document.getElementById('planGramAmount') as HTMLInputElement;
  const previewContainer = document.getElementById('plan-food-preview');

  if (addSection) addSection.classList.add('hidden');
  if (searchInput) searchInput.value = '';
  if (gramInput) gramInput.value = '100';
  if (previewContainer) previewContainer.classList.add('display-none');

  selectedPlanFood = null;
  currentMealType = null;
  hidePlanSearchResults();
}

export async function addFoodToPlan() {
  if (!selectedPlanFood || !currentMealType || !appState.currentTemplate) {
    swal('Oh no!', 'Please select a food item', 'error');
    return;
  }

  const gramAmountInput = document.getElementById('planGramAmount') as HTMLInputElement;
  const grams = parseFloat(gramAmountInput.value);

  if (!grams || grams <= 0) {
    swal('Oh no!', 'Please enter a valid amount in grams', 'error');
    return;
  }

  showLoading();

  try {
    const proportion = grams / 100;
    const plannedItem: Omit<PlannedFoodItem, 'id'> = {
      templateId: appState.currentTemplate.id!,
      mealType: currentMealType,
      name: selectedPlanFood.name,
      grams: grams,
      calories: Math.round(selectedPlanFood.info.calories * proportion),
      protein: Math.round(selectedPlanFood.info.protein * proportion * 10) / 10,
      fat: Math.round(selectedPlanFood.info.fat * proportion * 10) / 10,
      carbs: Math.round(selectedPlanFood.info.carbs * proportion * 10) / 10,
      fiber: Math.round(selectedPlanFood.info.fiber * proportion * 10) / 10,
      alkaline: selectedPlanFood.info.alkaline
    };

    await AppwriteDB.createPlannedFoodItem(plannedItem);
    await loadPlannedItemsForTemplate(appState.currentTemplate.id!);

    hideAddFoodToPlan();
    hideLoading();
    swal('Success!', 'Food added to meal plan!', 'success');
  } catch (error) {
    hideLoading();
    console.error('Add food to plan error:', error);
    if (error instanceof Error) {
      swal('Oh no!', 'Failed to add food: ' + error.message, 'error');
    }
  }
}

// Display functions
export function displayPlannedItems() {
  const mealTypes: MealType[] = ['breakfast', 'lunch', 'dinner', 'snacks'];

  mealTypes.forEach(mealType => {
    const container = document.getElementById(`${mealType}ItemsContainer`);
    if (!container) return;

    const items = appState.plannedItems.filter(item => item.mealType === mealType);

    if (items.length === 0) {
      container.innerHTML = '<p class="no-items-message">No foods planned for this meal</p>';
      return;
    }

    container.innerHTML = '';
    items.forEach(item => {
      const card = createPlannedItemCard(item);
      container.appendChild(card);
    });
  });
}

function createPlannedItemCard(item: PlannedFoodItem): HTMLElement {
  const card = document.createElement('div');
  card.className = 'planned-item-card';
  card.innerHTML = `
    <div class="planned-item-header">
      <span class="planned-item-name">${getCleanName(item.name)}</span>
      <span class="planned-item-grams">${item.grams}g</span>
    </div>
    <div class="planned-item-nutrition">
      <span>${item.calories} cal</span>
      <span>P: ${item.protein}g</span>
      <span>F: ${item.fat}g</span>
      <span>C: ${item.carbs}g</span>
    </div>
    <button class="delete-planned-item-btn" data-item-id="${item.id}">Delete</button>
  `;

  const deleteBtn = card.querySelector('.delete-planned-item-btn');
  if (deleteBtn) {
    deleteBtn.addEventListener('click', () => deletePlannedItem(item.id!));
  }

  return card;
}

export async function deletePlannedItem(itemId: string) {
  const confirm = await swal({
    title: 'Delete Item',
    text: 'Are you sure you want to delete this item from your meal plan?',
    icon: 'warning',
    buttons: {
      cancel: true,
      confirm: true,
    },
  });

  if (!confirm) return;

  showLoading();

  try {
    await AppwriteDB.deletePlannedFoodItem(itemId);
    if (appState.currentTemplate) {
      await loadPlannedItemsForTemplate(appState.currentTemplate.id!);
    }
    hideLoading();
  } catch (error) {
    hideLoading();
    console.error('Delete planned item error:', error);
    if (error instanceof Error) {
      swal('Oh no!', 'Failed to delete item: ' + error.message, 'error');
    }
  }
}

export function updatePlanTotals() {
  const totals = appState.plannedItems.reduce((acc, item) => {
    acc.calories += item.calories;
    acc.protein += item.protein;
    acc.fat += item.fat;
    acc.carbs += item.carbs;
    acc.fiber += item.fiber;
    return acc;
  }, { calories: 0, protein: 0, fat: 0, carbs: 0, fiber: 0 });

  // Update totals display
  const caloriesTotalEl = document.getElementById('planCaloriesTotal');
  const proteinValueEl = document.getElementById('planProteinValue');
  const fatValueEl = document.getElementById('planFatValue');
  const carboValueEl = document.getElementById('planCarboValue');
  const fiberValueEl = document.getElementById('planFiberValue');

  if (caloriesTotalEl) caloriesTotalEl.textContent = totals.calories.toString();
  if (proteinValueEl) proteinValueEl.textContent = Math.round(totals.protein * 10) / 10 + '';
  if (fatValueEl) fatValueEl.textContent = Math.round(totals.fat * 10) / 10 + '';
  if (carboValueEl) carboValueEl.textContent = Math.round(totals.carbs * 10) / 10 + '';
  if (fiberValueEl) fiberValueEl.textContent = Math.round(totals.fiber * 10) / 10 + '';

  // Update progress bars and goals
  updatePlanProgressBars(totals);
}

async function updatePlanProgressBars(totals: { calories: number, protein: number, fat: number, carbs: number, fiber: number }) {
  try {
    const settings = await AppwriteDB.getUserSettings();
    if (!settings || settings.length === 0) return;

    const userSettings = settings[settings.length - 1];

    // Update goal texts
    const caloriesGoalEl = document.getElementById('planCaloriesGoalText');
    const proteinGoalEl = document.getElementById('planProteinGoalText');
    const fatGoalEl = document.getElementById('planFatGoalText');
    const carboGoalEl = document.getElementById('planCarboGoalText');
    const fiberGoalEl = document.getElementById('planFiberGoalText');

    if (caloriesGoalEl) caloriesGoalEl.textContent = `of ${userSettings.caloriesGoal || 0}`;
    if (proteinGoalEl) proteinGoalEl.textContent = `of ${userSettings.proteinGoal}`;
    if (fatGoalEl) fatGoalEl.textContent = `of ${userSettings.fatGoal}`;
    if (carboGoalEl) carboGoalEl.textContent = `of ${userSettings.carboGoal}`;
    if (fiberGoalEl) fiberGoalEl.textContent = `of ${userSettings.fiberGoal}`;

    // Update progress bars
    updateProgressBar('planProteinProgress', totals.protein, userSettings.proteinGoal);
    updateProgressBar('planFatProgress', totals.fat, userSettings.fatGoal);
    updateProgressBar('planCarboProgress', totals.carbs, userSettings.carboGoal);
    updateProgressBar('planFiberProgress', totals.fiber, userSettings.fiberGoal);
  } catch (error) {
    console.error('Update progress bars error:', error);
  }
}

function updateProgressBar(elementId: string, current: number, goal: number) {
  const progressBar = document.getElementById(elementId);
  if (!progressBar) return;

  const percentage = Math.min((current / goal) * 100, 100);
  progressBar.style.width = `${percentage}%`;

  // Color coding: green when within range, yellow when getting close, red when over
  if (percentage < 80) {
    progressBar.style.backgroundColor = '#4CAF50'; // green
  } else if (percentage < 100) {
    progressBar.style.backgroundColor = '#FFC107'; // yellow
  } else {
    progressBar.style.backgroundColor = '#f44336'; // red
  }
}

// Quick add functions for food log
export async function displayQuickAddItems() {
  const quickAddSection = document.getElementById('quickAddSection');
  const quickAddContainer = document.getElementById('quickAddItemsContainer');

  if (!quickAddSection || !quickAddContainer) return;

  // Check if there's an active template
  const activeTemplate = await AppwriteDB.getActiveMealPlanTemplate();

  if (!activeTemplate) {
    quickAddSection.classList.add('hidden');
    return;
  }

  // Load planned items
  const plannedItems = await AppwriteDB.getPlannedItemsByTemplate(activeTemplate.$id);

  if (plannedItems.length === 0) {
    quickAddSection.classList.add('hidden');
    return;
  }

  // Show section and populate items
  quickAddSection.classList.remove('hidden');
  quickAddContainer.innerHTML = '';

  // Group by meal type
  const mealTypes: MealType[] = ['breakfast', 'lunch', 'dinner', 'snacks'];
  const mealIcons = {
    breakfast: '🌅',
    lunch: '☀️',
    dinner: '🌙',
    snacks: '🍿'
  };

  mealTypes.forEach(mealType => {
    const items = plannedItems.filter(item => item.mealType === mealType);

    if (items.length > 0) {
      // Add meal type header
      const mealHeader = document.createElement('h3');
      mealHeader.className = 'quick-add-meal-header';
      mealHeader.textContent = `${mealIcons[mealType]} ${mealType.charAt(0).toUpperCase() + mealType.slice(1)}`;
      quickAddContainer.appendChild(mealHeader);

      // Add items
      items.forEach(item => {
        const quickAddItem = createQuickAddButton(item);
        quickAddContainer.appendChild(quickAddItem);
      });
    }
  });
}

function createQuickAddButton(item: any): HTMLElement {
  const button = document.createElement('button');
  button.className = 'quick-add-btn';
  button.innerHTML = `
    <span class="quick-add-name">${getCleanName(item.name)}</span>
    <span class="quick-add-details">${item.grams}g • ${item.calories} cal</span>
  `;
  button.addEventListener('click', () => quickAddToFoodLog(item));
  return button;
}

async function quickAddToFoodLog(plannedItem: any) {
  showLoading();

  try {
    const now = new Date();
    const time = now.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });

    const selectedDate = new Date(); // This should be the actual selected date from the app
    const localDateTime = new Date(selectedDate.getTime() - (selectedDate.getTimezoneOffset() * 60000)).toISOString();

    const foodEntry = {
      name: plannedItem.name,
      grams: plannedItem.grams,
      calories: plannedItem.calories,
      protein: plannedItem.protein,
      fat: plannedItem.fat,
      carbs: plannedItem.carbs,
      fiber: plannedItem.fiber,
      time: time,
      date: localDateTime.split('T')[0],
      alkaline: plannedItem.alkaline
    };

    await AppwriteDB.saveFoodEntry(foodEntry);

    // Dispatch custom event to trigger food log reload
    const event = new CustomEvent('foodAdded');
    window.dispatchEvent(event);

    hideLoading();
    swal('Success!', `${getCleanName(plannedItem.name)} added to food log!`, 'success');
  } catch (error) {
    hideLoading();
    console.error('Quick add to food log error:', error);
    if (error instanceof Error) {
      swal('Oh no!', 'Failed to add food: ' + error.message, 'error');
    }
  }
}

// Event listener setup
export function setupMealPlannerEventListeners() {
  // Navigation buttons
  document.getElementById('mealPlannerBtn')?.addEventListener('click', toggleMealPlannerView);
  document.getElementById('mealPlannerBtnMobile')?.addEventListener('click', handleMobileMealPlannerClick);

  // Template management
  document.getElementById('newTemplateBtn')?.addEventListener('click', createNewTemplate);
  document.getElementById('deleteTemplateBtn')?.addEventListener('click', deleteCurrentTemplate);
  document.getElementById('templateSelector')?.addEventListener('change', (e) => {
    const target = e.target as HTMLSelectElement;
    handleTemplateChange(target.value);
  });

  // Add food buttons for each meal
  const addMealButtons = document.querySelectorAll('.add-meal-item-btn');
  addMealButtons.forEach(button => {
    button.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      const mealType = target.getAttribute('data-meal-type') as MealType;
      showAddFoodToPlan(mealType);
    });
  });

  // Add food to plan form
  document.getElementById('addFoodToPlanBtn')?.addEventListener('click', addFoodToPlan);
  document.getElementById('cancelFoodToPlanBtn')?.addEventListener('click', hideAddFoodToPlan);

  // Setup food search
  setupPlanFoodSearch();
}
