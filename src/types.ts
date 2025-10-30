type FoodCategory = 'fats' | 'proteins' | 'carbs' | 'leaves' | 'fruits' | 'low carb' | 'dairy';

export type FoodItem = {
  name: string;
  info: { calories: number, protein: number, fat: number, carbs: number, fiber: number, category: FoodCategory, alkaline: boolean }
}

export type FoodStorage = {
  id?: string;
  name: string;
  grams: number;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  fiber: number;
  time: string;
  date: string;
  alkaline: boolean | null;
};

export type UserSettings = {
  id?: string;
  caloriesGoal?: number;
  proteinGoal: number;
  fatGoal: number;
  carboGoal: number;
  fiberGoal: number;
};

export type DailyTotalCalories = {
  documentId: string;
  day: number;
  totalCalories: number;
};

export type SharedDay = {
  id?: string;
  shareId: string;
  userId: string;
  userName: string;
  date: string;
  foodEntries: string; // JSON stringified FoodStorage[]
  createdAt: string;
};
