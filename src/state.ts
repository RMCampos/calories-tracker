import { DailyTotalCalories, FoodItem, SharedDay } from "./types";

interface AppState {
  currentHighlightIndex: number;
  searchTimeout: number | null;
  searchResults: FoodItem[];
  calendarMonthlyCalories: DailyTotalCalories[];
  isSharedView: boolean;
  sharedData: SharedDay | null;
}

export const appState: AppState = {
  currentHighlightIndex: -1,
  searchTimeout: null,
  searchResults: [],
  calendarMonthlyCalories: [],
  isSharedView: false,
  sharedData: null
};
