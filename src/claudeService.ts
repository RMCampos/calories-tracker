import Anthropic from '@anthropic-ai/sdk';

const API_KEY = import.meta.env.VITE_CLAUDE_API_KEY;

// Initialize Claude client
const anthropic = new Anthropic({
  apiKey: API_KEY,
  dangerouslyAllowBrowser: true // Allow usage in browser (for development/demo purposes)
});

export interface NutritionInfo {
  vitamins: string[];
  minerals: string[];
  benefits: string[];
  notes: string;
}

// In-memory cache for nutrition info
// Key format: "foodName_grams" (e.g., "apple_100", "chicken breast_150")
const nutritionCache = new Map<string, NutritionInfo>();

/**
 * Generate cache key from food name and grams
 */
function getCacheKey(foodName: string, grams: number): string {
  return `${foodName.toLowerCase().trim()}_${grams}`;
}

/**
 * Get cached nutrition info if available
 */
function getCachedNutrition(foodName: string, grams: number): NutritionInfo | null {
  const key = getCacheKey(foodName, grams);
  return nutritionCache.get(key) || null;
}

/**
 * Store nutrition info in cache
 */
function cacheNutrition(foodName: string, grams: number, info: NutritionInfo): void {
  const key = getCacheKey(foodName, grams);
  nutritionCache.set(key, info);
  console.log(`Cached nutrition info for: ${key} (total cached: ${nutritionCache.size})`);
}

/**
 * Get detailed nutritional information for a food item using Claude AI
 * Uses in-memory cache to avoid repeated API calls for the same food/amount
 * @param foodName - The name of the food item
 * @returns Promise with nutritional information
 */
export async function getNutritionInfo(foodName: string): Promise<NutritionInfo> {
  // Check cache first
  const cached = getCachedNutrition(foodName, 100);
  if (cached) {
    console.log(`Using cached nutrition info for: ${foodName} (100g)`);
    return cached;
  }

  console.log(`Fetching nutrition info from AI for: ${foodName} (100g)`);
  try {
    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: `Provide detailed nutritional information for 100g of ${foodName}.

IMPORTANT: Respond in Brazilian Portuguese (pt-BR).

Focus on:
1. Key vitamins (e.g., A, B complex, C, D, E, K)
2. Important minerals (e.g., iron, calcium, magnesium, zinc, potassium)
3. Main health benefits
4. Any important notes or considerations

Format your response as JSON with this structure:
{
  "vitamins": ["Vitamina A: descrição", "Vitamina C: descrição", ...],
  "minerals": ["Ferro: descrição", "Cálcio: descrição", ...],
  "benefits": ["benefício 1", "benefício 2", ...],
  "notes": "Informações adicionais importantes"
}

Be concise but informative. Only include significant amounts of vitamins and minerals. All text must be in Brazilian Portuguese.`
        }
      ]
    });

    // Extract the text content from Claude's response
    const textContent = message.content.find(block => block.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text content in response');
    }

    // Parse the JSON response
    const responseText = textContent.text;

    // Extract JSON from the response (handle cases where Claude adds markdown formatting)
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not parse JSON from response');
    }

    const nutritionInfo: NutritionInfo = JSON.parse(jsonMatch[0]);

    // Cache the result for future use
    cacheNutrition(foodName, 100, nutritionInfo);

    return nutritionInfo;

  } catch (error) {
    console.error('Error getting nutrition info from Claude:', error);
    throw new Error('Failed to get nutrition information. Please try again.');
  }
}

/**
 * Clear the nutrition info cache (optional utility function)
 * Useful for testing or if you want to force fresh API calls
 */
export function clearNutritionCache(): void {
  const size = nutritionCache.size;
  nutritionCache.clear();
  console.log(`Cleared nutrition cache (${size} entries removed)`);
}

/**
 * Get cache statistics
 */
export function getCacheStats(): { size: number; keys: string[] } {
  return {
    size: nutritionCache.size,
    keys: Array.from(nutritionCache.keys())
  };
}
