import { DailyTotalCalories, FoodItem, SharedDay, MealPlanTemplate, PlannedFoodItem } from "./types";

interface AppState {
  currentHighlightIndex: number;
  searchTimeout: number | null;
  searchResults: FoodItem[];
  calendarMonthlyCalories: DailyTotalCalories[];
  isSharedView: boolean;
  sharedData: SharedDay | null;
  // Meal Planner state
  currentTemplate: MealPlanTemplate | null;
  plannedItems: PlannedFoodItem[];
  planSearchResults: FoodItem[];
  planCurrentHighlightIndex: number;
  planSearchTimeout: number | null;
}

export const appState: AppState = {
  currentHighlightIndex: -1,
  searchTimeout: null,
  searchResults: [],
  calendarMonthlyCalories: [],
  isSharedView: false,
  sharedData: null,
  // Meal Planner state
  currentTemplate: null,
  plannedItems: [],
  planSearchResults: [],
  planCurrentHighlightIndex: -1,
  planSearchTimeout: null
};
