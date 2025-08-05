// Simple test to check OpenAI API responses
console.log('Testing OpenAI API with exact app prompts...\n');

// Step 1 prompt - exactly what your app sends
const step1Prompt = `Parse this Arabic/Egyptian Arabic food text and extract food items with their quantities. Convert portions to grams.

Text: half grilled chicken

Extract:
- Food items 
- Quantities in grams (realistic portion sizes)

Return JSON: [{"name": "food item", "quantity": number_in_grams, "unit": "grams"}]`;

console.log('STEP 1 PROMPT:');
console.log('='.repeat(50));
console.log(step1Prompt);
console.log('='.repeat(50));

// What GPT-4o would likely return for "half grilled chicken"
const expectedStep1Result = '[{"name": "grilled chicken", "quantity": 700, "unit": "grams"}]';
console.log('EXPECTED STEP 1 RESULT:');
console.log(expectedStep1Result);
console.log('\n');

// Step 2 prompt - exactly what your app sends
const step2Prompt = `Calculate calories, protein, carbs, and fat for these food items and quantities. Return ONLY JSON, no explanations:

Foods with quantities:
- grilled chicken: 700g

Return ONLY this JSON format:
[{"name": "food name", "calories": number, "protein": number, "carbs": number, "fat": number, "quantity": number}]`;

console.log('STEP 2 PROMPT:');
console.log('='.repeat(50));
console.log(step2Prompt);
console.log('='.repeat(50));

// Analysis of what GPT-4o might return
console.log('ANALYSIS:');
console.log('Expected nutrition per 100g grilled chicken breast: 165 cal, 31g protein');
console.log('For 700g: 165 × 7 = 1155 calories, 31 × 7 = 217g protein');
console.log('');
console.log('Your app gets: 1530 calories, 322g protein');
console.log('Difference: +375 calories (+33%), +105g protein (+48%)');
console.log('');
console.log('POSSIBLE CAUSES:');
console.log('1. GPT-4o includes skin/fat in calculation');
console.log('2. GPT-4o uses whole chicken data instead of breast only');
console.log('3. GPT-4o assumes cooking oil/butter added');
console.log('4. Prompt doesn\'t specify "skinless, boneless breast"');
console.log('');
console.log('SOLUTION: Make prompt more specific:');
console.log('"Calculate for skinless, boneless grilled chicken breast without added fats"');