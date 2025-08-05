import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { colors, spacing } from '../../constants/theme';
import { ScreenHeader } from '../../components/layout';
import { openAIService } from '../../services/openai';

const VoiceTestScreen: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [translation, setTranslation] = useState('');
  const [nutritionResult, setNutritionResult] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleTest = async () => {
    if (!inputText.trim()) {
      Alert.alert('Error', 'Please enter some text to test');
      return;
    }

    setIsLoading(true);
    setTranslation('');
    setNutritionResult('');

    try {
      console.log('�� Testing with input:', inputText);
      
      // Test the parsing function
      const foods = await openAIService.parseFoodFromText(inputText);
      
      console.log('✅ Test result:', foods);
      
      // Format the results for display
      const formattedResult = foods.map((food, index) => {
        return `Food ${index + 1}: ${food.name}
- Quantity: ${food.quantity} ${food.unit}
- Cooking Method: ${food.cookingMethod || 'None'}
- Calories: ${food.calories || 'Unknown'}
- Protein: ${food.protein || 'Unknown'}g
- Carbs: ${food.carbs || 'Unknown'}g
- Fat: ${food.fat || 'Unknown'}g
- Confidence: ${food.confidence}
- Needs Quantity: ${food.needsQuantity ? 'Yes' : 'No'}
- Needs Cooking Method: ${food.needsCookingMethod ? 'Yes' : 'No'}
- Nutrition Complete: ${food.isNutritionComplete ? 'Yes' : 'No'}
- Notes: ${food.nutritionNotes || 'None'}
`;
      }).join('\n\n');

      setNutritionResult(formattedResult || 'No food items detected');
      
    } catch (error) {
      console.error('❌ Test failed:', error);
      Alert.alert('Test Failed', error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setInputText('');
    setTranslation('');
    setNutritionResult('');
  };

  const handleExample = () => {
    setInputText('اكلت نصف فرخة مشوية ربع كيلو ريش داني طبق رز و طاجن بمية باللحمة');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader title="Voice Parser Test" />
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Input Text (Arabic)</Text>
          <TextInput
            style={styles.textInput}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Enter Arabic food description here..."
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        <View style={styles.buttonRow}>
          <TouchableOpacity 
            style={[styles.button, styles.primaryButton]} 
            onPress={handleTest}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>
              {isLoading ? 'Testing...' : 'Test Parsing'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.button, styles.secondaryButton]} 
            onPress={handleExample}
          >
            <Text style={styles.buttonText}>Load Example</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.button, styles.clearButton]} 
            onPress={handleClear}
          >
            <Text style={styles.buttonText}>Clear</Text>
          </TouchableOpacity>
        </View>

        {translation && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Translation</Text>
            <View style={styles.resultBox}>
              <Text style={styles.resultText}>{translation}</Text>
            </View>
          </View>
        )}

        {nutritionResult && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Nutrition Results</Text>
            <View style={styles.resultBox}>
              <Text style={styles.resultText}>{nutritionResult}</Text>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    padding: spacing.md,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  textInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: spacing.md,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.surface,
    minHeight: 100,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  button: {
    flex: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: colors.primary,
  },
  secondaryButton: {
    backgroundColor: colors.secondary,
  },
  clearButton: {
    backgroundColor: colors.error,
  },
  buttonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  resultBox: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: spacing.md,
    backgroundColor: colors.surface,
  },
  resultText: {
    fontSize: 14,
    color: colors.text,
    fontFamily: 'monospace',
  },
});

export default VoiceTestScreen; 