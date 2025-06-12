import { foodDatabase } from './foodDatabase.js';
import { getButtonById, getButtonListByClassName, getDivById, getInputById, showFoodPreview } from './HtmlUtil.js';
import { FoodItem, FoodStorage } from './types.js';

// App state
let selectedDate = new Date().toISOString().split('T')[0];
let currentViewDate = new Date();

// Initialize the app
const init = () => {
  populateFoodSelect();
  updateCurrentDate();
  loadDayData(selectedDate);
  renderCalendar();
  addEvents();
}

const getFoodProportion = (grams: number, foodData: FoodItem): FoodItem => {
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
  const proportion = getFoodProportion(grams, foodData);

  const textArray: string[] = [];
  textArray.push(`Calories in ${grams}g: ${proportion.info.calories}; `);
  textArray.push(`Protein: ${proportion.info.protein}g; `);
  textArray.push(`Fat: ${proportion.info.fat}g; `);
  textArray.push(`Carbohydrates: ${proportion.info.carbs}g; `);
  textArray.push(`Fiber: ${proportion.info.fiber}g;`);

  getDivById('food-preview').innerHTML = textArray.join('');
  showFoodPreview(true);
}

const addEvents = () => {
  getInputById('foodSelect').addEventListener('change', () => {
    previewCalories();
  });

  getInputById('gramAmount')?.addEventListener('change', () => {
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
}

const addDeleteEvents = () => {
  const elements = getButtonListByClassName('delete-food-entry');
  Array.from(elements).forEach((el: HTMLButtonElement) => {
    el.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      const row = target.closest('tr');
      const entryId = row?.querySelector('.hidden-column')?.textContent;
      const entryIdNumber = entryId ? parseInt(entryId) : 0;
      if (entryIdNumber) {
        deleteEntry(selectedDate, entryIdNumber);
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
const addFood = () => {
  const foodSelect = getInputById('foodSelect');
  const gramAmount = getInputById('gramAmount');
    
  if (!foodSelect.value || !gramAmount.value) {
    alert('Please select a food item and enter amount');
    return;
  }

  const grams: number = parseFloat(gramAmount.value);
  const foodData: FoodItem = getFoodItemByName(foodSelect.value);
    
  // Calculate nutrition for the amount
  const proportion: FoodItem = getFoodProportion(grams, foodData);
  const entry: FoodStorage = {
    id: Date.now(),
    name: foodSelect.value,
    grams: grams,
    calories: proportion.info.calories,
    protein: proportion.info.protein,
    fat: proportion.info.fat,
    carbs: proportion.info.carbs,
    fiber: proportion.info.fiber,
    time: new Date().toLocaleTimeString('en-US', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  };

  // Save to localStorage
  const dayData = getDayData(selectedDate);
  dayData.push(entry);
  saveDayData(selectedDate, dayData);

  // Update display
  loadDayData(selectedDate);
  renderCalendar();

  // Reset form
  foodSelect.value = '';
  gramAmount.value = '100';
  showFoodPreview(false);
}

// Get day data from localStorage
const getDayData = (date: string): FoodStorage[] => {
  const key = `calories_${date}`;
  const saved = localStorage.getItem(key);
  if (!saved) {
    return [];
  }
  return JSON.parse(saved);
}

// Save day data to localStorage
const saveDayData = (date: string, data: FoodStorage[]) => {
  const key = `calories_${date}`;
  localStorage.setItem(key, JSON.stringify(data));
}

// Load and display day data
const loadDayData = (date: string) => {
  const dayData = getDayData(date);
  
  // Update counters
  let totalCalories = 0;
  let totalProtein = 0;
  let totalFat = 0;
  let totalCarbs = 0;
  let totalFiber = 0;

  dayData.forEach(entry => {
    totalCalories += entry.calories;
    totalProtein += entry.protein;
    totalFat += entry.fat;
    totalCarbs += entry.carbs;
    totalFiber += entry.fiber;
  });

  getDivById('caloriesCounter').textContent = totalCalories.toString();
  getDivById('proteinValue').textContent = (Math.round(totalProtein * 10) / 10).toString ();
  getDivById('fatValue').textContent = (Math.round(totalFat * 10) / 10).toString ();
  getDivById('carboValue').textContent = (Math.round(totalCarbs * 10) / 10).toString ();
  getDivById('fiberValue').textContent = (Math.round(totalFiber * 10) / 10).toString ();

  // Update table
  const tbody = document.getElementById('foodTableBody');
  if (!tbody) {
    throw Error('Unable to create row tables!');
  }
  tbody.innerHTML = '';

  dayData.forEach(entry => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td class="hidden-column">${entry.id}</td>
      <td>${entry.time}</td>
      <td>${entry.name}</td>
      <td>${entry.grams}</td>
      <td>${entry.calories}</td>
      <td>${entry.protein}</td>
      <td>${entry.fat}</td>
      <td>${entry.carbs}</td>
      <td>${entry.fiber}</td>
      <td><button class="delete-btn delete-food-entry">Delete</button></td>
    `;
    tbody.appendChild(row);
  });
  addDeleteEvents();
}

// Delete an entry
const deleteEntry = (date: string, entryId: number) => {
  if (confirm('Are you sure you want to delete this entry?')) {
    let dayData: FoodStorage[] = getDayData(date);
    dayData = dayData.filter(entry => entry.id !== entryId);
    saveDayData(date, dayData);
    loadDayData(selectedDate);
    renderCalendar();
  }
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

const selectDate = (date: string) => {
  selectedDate = date;
  updateCurrentDate();
  loadDayData(selectedDate);
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
    dayElement.onclick = () => selectDate(dateString);
  }
  
  // Check if this is today
  const today = new Date().toISOString().split('T')[0];
  if (!isOtherMonth && dateString === today) {
    dayElement.classList.add('today');
  }
  
  // Check if this is selected date
  if (!isOtherMonth && dateString === selectedDate) {
    dayElement.classList.add('selected');
  }
  
  // Check if this day has data
  const dayData = getDayData(dateString);
  if (dayData.length > 0) {
    dayElement.classList.add('has-data');
    const totalCalories = dayData.reduce((sum, entry) => sum + entry.calories, 0);
    
    dayElement.innerHTML = `
        <div>${day}</div>
        <div class="day-calories">${totalCalories} cal</div>
    `;
  } else {
    dayElement.textContent = day.toString();
  }
  
  return dayElement;
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', init);
