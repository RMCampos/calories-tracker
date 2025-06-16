import { FoodItem } from "./types";

export const foodDatabase: FoodItem[] = [
  // Gorduras - Fats
  { name: 'Abacate', info: { calories: 96, protein: 1.2, fat: 8.4, carbs: 6, fiber: 6.3, category: 'fats' } },
  { name: 'Amêndoas', info: { calories: 581, protein: 18.6, fat: 47.3, carbs: 29.5, fiber: 11.6, category: 'fats' } },
  { name: 'Amendoin natural', info: { calories: 611, protein: 26, fat: 49, carbs: 16, fiber: 8.5, category: 'fats' } },
  { name: 'Azeite de Oliva EV', info: { calories: 844, protein: 0, fat: 100, carbs: 0, fiber: 0, category: 'fats' } },
  { name: 'Castanha de Caju', info: { calories: 570, protein: 18.5, fat: 46.3, carbs: 29.1, fiber: 3.7, category: 'fats' } },
  { name: 'Castanha do Pará', info: { calories: 643, protein: 14.5, fat: 63.5, carbs: 15.1, fiber: 7.9, category: 'fats' } },
  { name: 'Semente de Chia', info: { calories: 490, protein: 15.6, fat: 30.7, carbs: 43.8, fiber: 37.7, category: 'fats' } },
  { name: 'Semente de Linhaça', info: { calories: 495, protein: 14.1, fat: 32.3, carbs: 43.3, fiber: 33.5, category: 'fats' } },
  { name: 'Semente de Gergelim', info: { calories: 584, protein: 21.2, fat: 50.4, carbs: 21.6, fiber: 11.9, category: 'fats' } },
  { name: 'Pasta de Amendoim Growth', info: { calories: 544, protein: 27, fat: 33, carbs: 20, fiber: 8, category: 'fats' } },

  // Proteínas - Proteins
  { name: 'Atum Sólido, natural', info: { calories: 135, protein: 28.3, fat: 2.7, carbs: 0, fiber: 0, category: 'proteins' } },
  { name: 'Filé de Tilápia, cozido', info: { calories: 128, protein: 26.1, fat: 2.6, carbs: 0, fiber: 0, category: 'proteins' } },
  { name: 'Ovo inteiro, cozido', info: { calories: 146, protein: 13.3, fat: 9.5, carbs: 0.6, fiber: 0, category: 'proteins' } },
  { name: 'Ovo clara, cozido', info: { calories: 59, protein: 13.4, fat: 0.1, carbs: 0, fiber: 0, category: 'proteins' } },
  { name: 'PTS, crua', info: { calories: 288, protein: 52, fat: 0, carbs: 20, fiber: 14, category: 'proteins' } },
  { name: 'Patinho moído, grelhado', info: { calories: 219, protein: 35.9, fat: 7.3, carbs: 0, fiber: 0, category: 'proteins' } },
  { name: 'Soja em Pó Growth', info: { calories: 400, protein: 86.7, fat: 5, carbs: 3.3, fiber: 0, category: 'proteins' } },
  { name: 'Sobrecoxa s/pele, cozida', info: { calories: 245, protein: 24.9, fat: 15.4, carbs: 0, fiber: 0, category: 'proteins' } },
  { name: 'Tofu', info: { calories: 65, protein: 6.5, fat: 4, carbs: 2, fiber: 0.75, category: 'proteins' } },
  { name: 'Feijão preto, cozido', info: { calories: 77, protein: 4.5, fat: 0.5, carbs: 14, fiber: 8.4, category: 'proteins' } },
  { name: 'Lentilha, cozida', info: { calories: 93, protein: 6.3, fat: 0.5, carbs: 16.3, fiber: 7.9, category: 'proteins' } },
  { name: 'Grão de Bico, cozido', info: { calories: 180, protein: 9.5, fat: 3, carbs: 30, fiber: 8.6, category: 'proteins' } },

  // Carboidratos, amiláceos - Carbs
  { name: 'Banana Nanica', info: { calories: 92, protein: 1.4, fat: 0.1, carbs: 23.8, fiber: 1.9, category: 'carbs (high)' } },
  { name: 'Manga Palmer', info: { calories: 72, protein: 0.4, fat: 0.2, carbs: 19.4, fiber: 1.6, category: 'carbs (high)' } },
  { name: 'Mamão', info: { calories: 40, protein: 0.5, fat: 0.1, carbs: 10.4, fiber: 1, category: 'carbs (high)' } },
  { name: 'Batata doce, assada', info: { calories: 90, protein: 2.0, fat: 0.1, carbs: 20.7, fiber: 3.3, category: 'carbs (high)' } },
  { name: 'Batata doce, cozida', info: { calories: 77, protein: 0.6, fat: 0.1, carbs: 18.4, fiber: 2.2, category: 'carbs (high)' } },
  { name: 'Batata doce, crua', info: { calories: 118, protein: 1.3, fat: 0.1, carbs: 28.2, fiber: 2.6, category: 'carbs (high)' } },
  { name: 'Batata inglesa, assada', info: { calories: 94, protein: 2.1, fat: 0.1, carbs: 21.8, fiber: 2.1, category: 'carbs (high)' } },
  { name: 'Batata inglesa, cozida', info: { calories: 52, protein: 1.2, fat: 0, carbs: 11.9, fiber: 1.3, category: 'carbs (high)' } },
  { name: 'Batata inglesa, crua', info: { calories: 64, protein: 1.8, fat: 0, carbs: 14.7, fiber: 1.2, category: 'carbs (high)' } },
  { name: 'Mandioca, cozida', info: { calories: 125, protein: 0.6, fat: 0.3, carbs: 30.1, fiber: 1.6, category: 'carbs (high)' } },
  { name: 'Pão Francês', info: { calories: 300, protein: 8, fat: 3.1, carbs: 58.6, fiber: 2.3, category: 'carbs (high)' } },
  { name: 'Polenta, cozida', info: { calories: 192, protein: 4.8, fat: 1.2, carbs: 40, fiber: 3.8, category: 'carbs (high)' } },
  { name: 'Arroz integral, cozido', info: { calories: 130, protein: 2.7, fat: 0.3, carbs: 28, fiber: 0.4, category: 'carbs (high)' } },
  { name: 'Aveia', info: { calories: 394, protein: 13.9, fat: 8.5, carbs: 66.6, fiber: 9.1, category: 'carbs (high)' } },
  { name: 'Ervilha, cozida', info: { calories: 88, protein: 7.5, fat: 0.5, carbs: 14.2, fiber: 9.7, category: 'carbs (high)' } },
  { name: 'Pão integral de forma', info: { calories: 253, protein: 9.4, fat: 3.7, carbs: 49.9, fiber: 6.9, category: 'carbs (high)' } },
  { name: 'Pipoca c/óleo', info: { calories: 448, protein: 9.9, fat: 15.9, carbs: 70.3, fiber: 14.3, category: 'carbs (high)' } },
  { name: 'Pipoca s/óleo', info: { calories: 178, protein: 3.3, fat: 7.2, carbs: 25, fiber: 4.3, category: 'carbs (high)' } },
  { name: 'Quinoa, cozida', info: { calories: 158, protein: 5.55, fat: 2.5, carbs: 29, fiber: 2.5, category: 'carbs (high)' } },
  { name: '70% Nibs Garoto', info: { calories: 544, protein: 8.4, fat: 40, carbs: 34, fiber: 0, category: 'carbs (high)' } },
  { name: 'Barra de Proteína Vegana Growth', info: { calories: 400, protein: 25, fat: 22, carbs: 25, fiber: 8, category: 'carbs (high)' } },
  { name: 'Goiabada', info: { calories: 320, protein: 0, fat: 0, carbs: 80, fiber: 4.5, category: 'carbs (high)' } },
  { name: 'Goma de Tapioca', info: { calories: 226, protein: 0, fat: 0, carbs: 57, fiber: 0, category: 'carbs (high)' } },
  { name: 'Mel Silvestre', info: { calories: 230, protein: 0, fat: 0, carbs: 65, fiber: 0, category: 'carbs (high)' } },
  { name: 'Melado', info: { calories: 297, protein: 0, fat: 0, carbs: 76.6, fiber: 0, category: 'carbs (high)' } },
  { name: 'Tâmara desidratada', info: { calories: 230, protein: 0.3, fat: 33, carbs: 63.3, fiber: 7, category: 'carbs (high)' } },

  // Folhas e verduras - Leaves
  { name: 'Agrião', info: { calories: 17, protein: 2.7, fat: 0.2, carbs: 2.3, fiber: 2.1, category: 'leaves' } },
  { name: 'Espinafre', info: { calories: 16, protein: 2, fat: 0.2, carbs: 2.6, fiber: 2.1, category: 'leaves' } },
  { name: 'Rúcula', info: { calories: 13, protein: 1.8, fat: 0.1, carbs: 2.2, fiber: 1.7, category: 'leaves' } },
  { name: 'Spirulina', info: { calories: 290, protein: 57.5, fat: 23.9, carbs: 7.7, fiber: 0, category: 'leaves' } },

  // Frutas - Fruits
  { name: 'Abacaxi', info: { calories: 48, protein: 0.9, fat: 0.1, carbs: 12.3, fiber: 1, category: 'fruits' } },
  { name: 'Laranja', info: { calories: 37, protein: 1, fat: 0.1, carbs: 8.9, fiber: 0.8, category: 'fruits' } },
  { name: 'Maçã', info: { calories: 56, protein: 0.3, fat: 0, carbs: 15.2, fiber: 1.3, category: 'fruits' } },
  { name: 'Melancia', info: { calories: 33, protein: 0.9, fat: 0, carbs: 8.1, fiber: 0.1, category: 'fruits' } },
  { name: 'Melão', info: { calories: 29, protein: 0.7, fat: 0, carbs: 7.5, fiber: 0.3, category: 'fruits' } },
  { name: 'Uva', info: { calories: 53, protein: 0.7, fat: 0.2, carbs: 13.6, fiber: 0.9, category: 'fruits' } },
  
  // Low carb
  { name: 'Abóbora Cabotian, crua', info: { calories: 39, protein: 1.7, fat: 0.5, carbs: 8.4, fiber: 2.2, category: 'carbs (low)' } },
  { name: 'Abóbora Cabotian, cozida', info: { calories: 48, protein: 1.4, fat: 0.7, carbs: 10.8, fiber: 2.5, category: 'carbs (low)' } },
  { name: 'Cenoura, cozida', info: { calories: 30, protein: 0.8, fat: 0.2, carbs: 6.7, fiber: 2.6, category: 'carbs (low)' } },
  { name: 'Tomate', info: { calories: 15, protein: 1.1, fat: 0.2, carbs: 3.1, fiber: 1.2, category: 'carbs (low)' } },
  { name: 'Brócolis, cozido', info: { calories: 25, protein: 2.1, fat: 0.5, carbs: 4.4, fiber: 3.4, category: 'carbs (low)' } },
  { name: 'Couve flor, cozida', info: { calories: 19, protein: 1.2, fat: 0.3, carbs: 3.9, fiber: 2.1, category: 'carbs (low)' } },
  { name: 'Pepino', info: { calories: 10, protein: 0.9, fat: 0, carbs: 2, fiber: 1.1, category: 'carbs (low)' } },
  { name: 'Chuchu, cozido', info: { calories: 19, protein: 0.4, fat: 0, carbs: 4.9, fiber: 1.0, category: 'carbs (low)' } },
  
  
];
