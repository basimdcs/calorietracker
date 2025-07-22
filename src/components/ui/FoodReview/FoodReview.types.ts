import { ParsedFoodItem } from '../../../types';

export interface FoodReviewProps {
  foods: ParsedFoodItem[];
  onUpdateFood: (index: number, updatedFood: ParsedFoodItem) => void;
  onRemoveFood: (index: number) => void;
  onAddFood: () => void;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
} 