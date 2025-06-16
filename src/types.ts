type FoodCategory = 'fats' | 'proteins' | 'carbs (high)' | 'leaves' | 'fruits' | 'carbs (low)';

export type FoodItem = {
  name: string;
  info: { calories: number, protein: number, fat: number, carbs: number, fiber: number, category: FoodCategory }
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
};

export type UserSettings = {
  id?: string;
  proteinGoal: number;
  fatGoal: number;
  carboGoal: number;
  fiberGoal: number;
};
