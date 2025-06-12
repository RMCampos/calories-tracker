// App state
let selectedDate = new Date().toISOString().split('T')[0];
let currentViewDate = new Date();

// Initialize the app
function init() {
    populateFoodSelect();
    updateCurrentDate();
    loadDayData(selectedDate);
    renderCalendar();
    addEvents();
}

function getFoodProportion(grams, foodData) {
  const multiplier = grams / 100; // Database values are per 100g
  return {
      calories: Math.round(foodData.calories * multiplier),
      protein: Math.round(foodData.protein * multiplier * 10) / 10,
      fat: Math.round(foodData.fat * multiplier * 10) / 10,
      carbs: Math.round(foodData.carbs * multiplier * 10) / 10,
      fiber: Math.round(foodData.fiber * multiplier * 10) / 10
  };
}

function previewCalories() {
  const foodSelect = document.getElementById('foodSelect');
  const gramAmount = document.getElementById('gramAmount');
  
  if (!foodSelect.value) {
    document.getElementById('food-preview').innerHTML = '';
    document.getElementById('food-preview').classList = 'add-food-form-item display-none';
    return;
  }

  let grams = 100;
  if (gramAmount && gramAmount.value && parseFloat(gramAmount.value) > 0) {
    grams = parseFloat(gramAmount.value);
  }

  const foodName = foodSelect.value;
  const foodData = foodDatabase[foodName];
  const proportion = getFoodProportion(grams, foodData);

  const textArray = [];
  textArray.push(`Calories in ${grams}g: ${proportion.calories}; `);
  textArray.push(`Protein: ${proportion.protein}g; `);
  textArray.push(`Fat: ${proportion.fat}g; `);
  textArray.push(`Carbohydrates: ${proportion.carbs}g; `);
  textArray.push(`Fiber: ${proportion.fiber}g;`);

  document.getElementById('food-preview').innerHTML = textArray.join('');
  document.getElementById('food-preview').classList = 'add-food-form-item display-block';
}

function addEvents() {
  document.getElementById('foodSelect').addEventListener('change', () => {
    previewCalories();
  });

  document.getElementById('gramAmount').addEventListener('change', () => {
    previewCalories();
  });
}

// Populate food select dropdown
function populateFoodSelect() {
    const select = document.getElementById('foodSelect');
    select.innerHTML = '<option value="">Select a food item...</option>';
    
    const sortedFoods = Object.keys(foodDatabase).sort();
    sortedFoods.forEach(food => {
        const option = document.createElement('option');
        option.value = food;
        option.textContent = food.charAt(0).toUpperCase() + food.slice(1);
        select.appendChild(option);
    });
}

// Update current date display
function updateCurrentDate() {
    const date = new Date(selectedDate);
    const options = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    };
    document.getElementById('currentDate').textContent = date.toLocaleDateString('en-US', options);
}

// Add food to the log
function addFood() {
    const foodSelect = document.getElementById('foodSelect');
    const gramAmount = document.getElementById('gramAmount');
    
    if (!foodSelect.value || !gramAmount.value) {
        alert('Please select a food item and enter amount');
        return;
    }

    const foodName = foodSelect.value;
    const grams = parseFloat(gramAmount.value);
    const foodData = foodDatabase[foodName];
    
    // Calculate nutrition for the amount
    const proportion = getFoodProportion(grams, foodData);
    const entry = {
        id: Date.now(),
        name: foodName,
        grams: grams,
        calories: proportion.calories,
        protein: proportion.protein,
        fat: proportion.fat,
        carbs: proportion.carbs,
        fiber: proportion.fiber,
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
    document.getElementById('food-preview').innerHTML = '';
    document.getElementById('food-preview').classList = 'add-food-form-item display-none';
}

// Get day data from localStorage
function getDayData(date) {
    const key = `calories_${date}`;
    return JSON.parse(localStorage.getItem(key)) || [];
}

// Save day data to localStorage
function saveDayData(date, data) {
    const key = `calories_${date}`;
    localStorage.setItem(key, JSON.stringify(data));
}

// Load and display day data
function loadDayData(date) {
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

    document.getElementById('caloriesCounter').textContent = totalCalories;
    document.getElementById('proteinValue').textContent = Math.round(totalProtein * 10) / 10;
    document.getElementById('fatValue').textContent = Math.round(totalFat * 10) / 10;
    document.getElementById('carboValue').textContent = Math.round(totalCarbs * 10) / 10;
    document.getElementById('fiberValue').textContent = Math.round(totalFiber * 10) / 10;

    // Update table
    const tbody = document.getElementById('foodTableBody');
    tbody.innerHTML = '';

    dayData.forEach(entry => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${entry.time}</td>
            <td>${entry.name.charAt(0).toUpperCase() + entry.name.slice(1)}</td>
            <td>${entry.grams}</td>
            <td>${entry.calories}</td>
            <td>${entry.protein}</td>
            <td>${entry.fat}</td>
            <td>${entry.carbs}</td>
            <td>${entry.fiber}</td>
            <td><button class="delete-btn" onclick="deleteEntry('${date}', ${entry.id})">Delete</button></td>
        `;
        tbody.appendChild(row);
    });
}

// Delete an entry
function deleteEntry(date, entryId) {
    if (confirm('Are you sure you want to delete this entry?')) {
        let dayData = getDayData(date);
        dayData = dayData.filter(entry => entry.id !== entryId);
        saveDayData(date, dayData);
        loadDayData(selectedDate);
        renderCalendar();
    }
}

// Calendar functions
function previousMonth() {
    currentViewDate.setMonth(currentViewDate.getMonth() - 1);
    renderCalendar();
}

function nextMonth() {
    currentViewDate.setMonth(currentViewDate.getMonth() + 1);
    renderCalendar();
}

function selectDate(date) {
    selectedDate = date;
    updateCurrentDate();
    loadDayData(selectedDate);
    renderCalendar();
}

function renderCalendar() {
    const year = currentViewDate.getFullYear();
    const month = currentViewDate.getMonth();
    
    // Update calendar title
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];
    document.getElementById('calendarTitle').textContent = `${monthNames[month]} ${year}`;
    
    // Clear calendar
    const grid = document.getElementById('calendarGrid');
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

function createDayElement(day, isOtherMonth, year, month) {
    const dayElement = document.createElement('div');
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
        dayElement.textContent = day;
    }
    
    return dayElement;
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', init);
