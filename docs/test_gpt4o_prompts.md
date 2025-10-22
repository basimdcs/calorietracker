# Testing GPT-4o Prompts

## Step 1: Food Parsing Prompt
```
Parse this Arabic/Egyptian Arabic food text and extract food items with their quantities. Convert portions to grams.

Text: half grilled chicken

Extract:
- Food items 
- Quantities in grams (realistic portion sizes)

Return JSON: [{"name": "food item", "quantity": number_in_grams, "unit": "grams"}]
```

## Step 2: Nutrition Calculation Prompt
```
Calculate calories, protein, carbs, and fat for these food items and quantities. Return ONLY JSON, no explanations:

Foods with quantities:
- grilled chicken: 700g

Return ONLY this JSON format:
[{"name": "food name", "calories": number, "protein": number, "carbs": number, "fat": number, "quantity": number}]
```

## Expected Results
- 100g grilled chicken = 165 calories, 31g protein
- 700g grilled chicken = 1155 calories, 217g protein

## Actual App Results  
- 700g grilled chicken = 1530 calories, 322g protein