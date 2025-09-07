import { DailyTotalCalories, FoodItem } from "./types";

interface AppState {
  currentHighlightIndex: number;
  searchTimeout: number | null;
  searchResults: FoodItem[];
  calendarMonthlyCalories: DailyTotalCalories[];
}

export const appState: AppState = {
  currentHighlightIndex: -1,
  searchTimeout: null,
  searchResults: [],
  calendarMonthlyCalories: []
};
