export type FoodItem = {
  name: string;
  info: { calories: number, protein: number, fat: number, carbs: number, fiber: number }
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
