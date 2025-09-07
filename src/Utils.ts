import { getDivById } from "./DomUtils";
import { appState } from "./state";

export const SECOND = 1000;
export const QUICK_DELAY = 0.3 * SECOND;

export function showLoading() {
  getDivById('loading-overlay').classList.remove('hidden');
}

export function hideLoading() {
  getDivById('loading-overlay').classList.add('hidden');
}

export function scrollToCalendarView() {
  const calendarSection = document.querySelector('.calendar-section') as HTMLElement;
  if (calendarSection) {
    calendarSection.scrollIntoView({ 
      behavior: 'smooth',
      block: 'start'
    });
  }
}

export function handleMobileCalendarClick() {
  closeMobileMenu();
  scrollToCalendarView();
}

export function toggleMobileMenu() {
  const mobileMenu = document.getElementById('mobileMenu');
  if (mobileMenu) {
    mobileMenu.classList.toggle('hidden');
  }
}

export function closeMobileMenu() {
  const mobileMenu = document.getElementById('mobileMenu');
  if (mobileMenu) {
    mobileMenu.classList.add('hidden');
  }
}

export function getCleanName(foodName: string): string  {
  const newName = foodName
    .replace(/á/g, 'a')
    .replace(/ã/g, 'a')
    .replace(/â/g, 'a')
    .replace(/ê/g, 'e')
    .replace(/é/g, 'e')
    .replace(/ó/g, 'o')
    .replace(/ú/g, 'u')
    .replace(/ç/g, 'c');
  return newName.toLowerCase();
}

export function navigateResultsKeyboard(direction: number) {
  const items = getDivById('searchResults').querySelectorAll('.search-result-item');
  if (items.length === 0) return;
  
  // Remove current highlight
  if (appState.currentHighlightIndex >= 0) {
      items[appState.currentHighlightIndex].classList.remove('highlighted');
  }
  
  // Calculate new index
  appState.currentHighlightIndex += direction;
  if (appState.currentHighlightIndex < 0) appState.currentHighlightIndex = items.length - 1;
  if (appState.currentHighlightIndex >= items.length) appState.currentHighlightIndex = 0;

  // Add new highlight
  items[appState.currentHighlightIndex].classList.add('highlighted');
  items[appState.currentHighlightIndex].scrollIntoView({ block: 'nearest' });
}

export function hideSearchResults() {
  getDivById('searchResults').classList.remove('show');
  appState.currentHighlightIndex = -1;
}

export function toggleCardHandler(e: Event) {
  e.preventDefault();
  e.stopPropagation();
  
  const card = e.currentTarget as HTMLElement;
  card.classList.toggle('expanded');
  
  const cardDetails = card.nextElementSibling as HTMLElement;
  if (cardDetails && cardDetails.classList.contains('card-details')) {
    cardDetails.classList.toggle('expanded');
  }
}

export function delay(seconds: number) {
  return new Promise(resolve => setTimeout(resolve, seconds * 1000));
}

export function getIcon(category: string) {
  const icons = {
    'fats': '🥑 🍳 🍟',
    'proteins': '🫘 🥩 🥚',
    'carbs (high)': '🍞 🥔 🍠',
    'leaves': '🥬 🥗 🌿',
    'fruits': '🍊 🍇 🍎',
    'carbs (low)': '🥦 🍅 🍓',
    'dairy': '🧀 🧈 🥛'
  };

  return icons[category];
}
