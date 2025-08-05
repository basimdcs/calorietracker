# Food Data Access Patterns - Developer Guide

## 🚨 CRITICAL: Read This Before Working with Food Data

This guide prevents the data inconsistency bugs that caused the Home/History screen issues.

## The Problem We Solved

**Original Issue**: Different screens accessed food data differently:
- Home screen used `useNutrition().todayLog` (broken)
- History screen used `useFoodStore().dailyLogs` (working)
- Properties accessed incorrectly: `food.name` vs `food.foodItem.name`

**Impact**: Food items showed in History but not Home screen, causing user confusion.

## The Solution: Centralized Data Access

### 1. ALWAYS Use `useFoodData()` Hook

```tsx
// ✅ CORRECT - Use centralized hook
import { useFoodData } from '../hooks/useFoodData';

const MyComponent = () => {
  const { todayItems, removeFood } = useFoodData();
  // ... rest of component
};
```

```tsx
// ❌ WRONG - Don't access store directly
import { useFoodStore } from '../stores/foodStore';

const MyComponent = () => {
  const { dailyLogs } = useFoodStore(); // Inconsistent!
  const todayItems = dailyLogs.find(log => log.date === today)?.foods || [];
};
```

### 2. ALWAYS Use `DisplayFood` Type

```tsx
// ✅ CORRECT - Use DisplayFood for UI
import { useFoodData } from '../hooks/useFoodData';
import { toDisplayFood } from '../types/display';

const MyComponent = () => {
  const { todayItems } = useFoodData();
  const displayItems = todayItems.map(toDisplayFood);
  
  return (
    <div>
      {displayItems.map(food => (
        <div key={food.id}>
          <h3>{food.name}</h3> {/* ✅ Flattened property */}
          <p>{food.calories} calories</p> {/* ✅ Direct access */}
        </div>
      ))}
    </div>
  );
};
```

```tsx
// ❌ WRONG - Direct LoggedFood access
const MyComponent = () => {
  const { todayItems } = useFoodData();
  
  return (
    <div>
      {todayItems.map(food => (
        <div key={food.id}>
          <h3>{food.name}</h3> {/* ❌ Will crash - should be food.foodItem.name */}
          <p>{food.totalCalories} calories</p> {/* ❌ Will crash - should be food.nutrition.calories */}
        </div>
      ))}
    </div>
  );
};
```

### 3. ALWAYS Use `<FoodItem>` Component

```tsx
// ✅ CORRECT - Use reusable component
import { FoodItem } from '../components/ui/FoodItem';
import { useFoodData } from '../hooks/useFoodData';
import { toDisplayFood } from '../types/display';

const MyComponent = () => {
  const { todayItems, removeFood } = useFoodData();
  const displayItems = todayItems.map(toDisplayFood);
  
  return (
    <div>
      {displayItems.map(food => (
        <FoodItem 
          key={food.id}
          food={food}
          onDelete={(id) => removeFood(today, id)}
          showMacros={true}
        />
      ))}
    </div>
  );
};
```

## Data Structure Reference

### LoggedFood (Raw Store Data)
```typescript
interface LoggedFood {
  id: string;
  foodItem: {
    name: string;           // ← Note: nested!
    servingSize: number;
    servingSizeUnit: string;
  };
  quantity: number;
  nutrition: {              // ← Note: nested!
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  loggedAt: Date | string;  // ← Note: not 'timestamp'!
  mealType: MealType;
}
```

### DisplayFood (UI-Friendly Data)
```typescript
interface DisplayFood {
  id: string;
  name: string;           // ← Flattened from foodItem.name
  calories: number;       // ← Flattened from nutrition.calories
  protein: number;        // ← Flattened from nutrition.protein
  // ... other flattened properties
  displayQuantity: string; // ← Pre-formatted: "2 × 100g"
  displayTime: string;     // ← Pre-formatted: "10:30 AM"
}
```

## Common Property Access Patterns

| Need | ❌ Wrong | ✅ Correct |
|------|----------|------------|
| Food Name | `food.name` | `food.foodItem.name` |
| Calories | `food.totalCalories` | `food.nutrition.calories` |
| Protein | `food.protein` | `food.nutrition.protein` |
| Timestamp | `food.timestamp` | `food.loggedAt` |
| Quantity Display | `food.quantity + 'g'` | `${food.quantity} × ${food.foodItem.servingSize}${food.foodItem.servingSizeUnit}` |

## Testing Checklist

Before deploying food-related features:

- [ ] Does the feature work in both Home AND History screens?
- [ ] Are you using `useFoodData()` hook?
- [ ] Are you using `DisplayFood` type for UI?
- [ ] Are you using `<FoodItem>` component?
- [ ] Does the console show any "Cannot read property" errors?
- [ ] Do deleted items disappear from both screens?

## File Organization

```
src/
├── hooks/
│   └── useFoodData.ts          # ← Central data access
├── types/
│   ├── index.ts                # ← Raw data types
│   └── display.ts              # ← UI-friendly types
├── components/ui/
│   └── FoodItem.tsx            # ← Reusable food component
└── screens/
    ├── home/HomeScreen.tsx     # ← Uses centralized patterns
    └── history/HistoryScreen.tsx # ← Uses centralized patterns
```

## Migration Guide

If you find old code that doesn't follow these patterns:

1. **Replace direct store access**:
   ```tsx
   // Before
   const { dailyLogs } = useFoodStore();
   const todayItems = dailyLogs.find(...)?.foods || [];
   
   // After
   const { todayItems } = useFoodData();
   ```

2. **Replace custom food item JSX**:
   ```tsx
   // Before
   <View style={styles.foodItem}>
     <Text>{food.foodItem.name}</Text>
     {/* ... custom JSX */}
   </View>
   
   // After
   <FoodItem food={toDisplayFood(food)} onDelete={handleDelete} />
   ```

3. **Fix property access**:
   ```tsx
   // Before
   <Text>{food.name}</Text> // Will crash
   
   // After
   <Text>{food.foodItem.name}</Text> // Raw data
   // OR
   <Text>{displayFood.name}</Text> // Display data
   ```

## Emergency Debugging

If food items aren't showing:

1. Check console for errors
2. Add debug logging:
   ```tsx
   const { debug } = useFoodData();
   console.log('Debug info:', debug);
   ```
3. Verify data exists: `debug.totalLogs > 0`
4. Verify today's data: `debug.todayItemCount > 0`
5. Check property access: Use browser devtools to inspect `food` objects

## Future Development Rules

1. **Never access `useFoodStore().dailyLogs` directly in UI components**
2. **Always use `useFoodData()` for food data access**
3. **Always use `DisplayFood` type for UI rendering**
4. **Always use `<FoodItem>` component for consistency**
5. **Add new data patterns to `useFoodData()` hook, not individual components**

---

**Remember**: The extra abstraction prevents bugs and ensures consistency across all screens. Always follow these patterns!