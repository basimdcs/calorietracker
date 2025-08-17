import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, spacing } from '../../constants/theme';
import { ScreenHeader } from '../../components/layout';
import { FoodReviewNew } from '../../components/ui/FoodReview/FoodReviewNew';
import { TranscriptDisplay } from '../../components/voice/TranscriptDisplay';
import { VoiceInstructions } from '../../components/voice/VoiceInstructions';
import { RecordingButton } from '../../components/voice/RecordingButton';
import { UsageProgressBar } from '../../components/ui/UsageProgressBar';
import { useFoodStore } from '../../stores/foodStore';
import { useUserStore } from '../../stores/userStore';
import { ParsedFoodItem } from '../../types';
import { useVoiceRecording } from '../../hooks/useVoiceRecording';
import { useVoiceProcessing } from '../../hooks/useVoiceProcessing';
import { useRevenueCatContext } from '../../contexts/RevenueCatContext';
import { usePaywall } from '../../hooks/usePaywall';
import { testBasicOpenAIQuery, parseFoodFromTextO3, openAIService } from '../../services/openai';
import { parseFoodFromTextGemini, testBasicGeminiQuery } from '../../services/gemini';

// Voice processing states for UI
type VoiceState = 'ready' | 'recording' | 'processing' | 'reviewing';

const VoiceScreenProduction: React.FC = () => {
  const [voiceState, setVoiceState] = useState<VoiceState>('ready');
  const [parsedFoods, setParsedFoods] = useState<ParsedFoodItem[]>([]);
  const [useGPT5, setUseGPT5] = useState(false);
  
  const { addFoodItem, logFood, updateCurrentDate } = useFoodStore();
  const { incrementRecordingUsage, getUsageStats, profile } = useUserStore();
  const { state: revenueCatState, actions: revenueCatActions } = useRevenueCatContext();
  const { presentPaywallIfNeededWithAlert } = usePaywall();
  
  // Custom hooks for voice functionality
  const voiceRecording = useVoiceRecording();
  const voiceProcessing = useVoiceProcessing();

  // Derive current error from hooks
  const currentError = voiceRecording.state.error || voiceProcessing.data.error;

  // Get usage stats - use RevenueCat if available, fallback to userStore
  const getCurrentUsageStats = () => {
    if (revenueCatState.isInitialized && !revenueCatState.error) {
      // Use RevenueCat usage info if available
      return {
        recordingsUsed: revenueCatState.usageInfo.recordingsUsed,
        recordingsRemaining: revenueCatState.usageInfo.recordingsRemaining,
        monthlyLimit: revenueCatState.usageInfo.recordingsLimit,
        resetDate: revenueCatState.usageInfo.resetDate.toISOString(),
        usagePercentage: revenueCatState.usageInfo.recordingsLimit 
          ? Math.min(100, (revenueCatState.usageInfo.recordingsUsed / revenueCatState.usageInfo.recordingsLimit) * 100) 
          : 0,
      };
    } else {
      // Fallback to userStore
      return getUsageStats();
    }
  };

  // Temporary test function to force paywall (remove in production)
  const testPaywall = useCallback(async () => {
    console.log('🧪 Testing paywall...');
    
    // Check RevenueCat initialization status before calling paywall
    console.log('🔍 Pre-paywall RevenueCat status:', {
      isInitialized: revenueCatState.isInitialized,
      isLoading: revenueCatState.isLoading,
      error: revenueCatState.error,
      tier: revenueCatState.subscriptionStatus.tier
    });
    
    if (!revenueCatState.isInitialized) {
      Alert.alert(
        'RevenueCat Not Ready', 
        'RevenueCat is not initialized yet. Please try again in a moment.',
        [
          {
            text: 'Retry Initialize',
            onPress: async () => {
              console.log('🔄 Manual RevenueCat initialization...');
              await revenueCatActions.initializeRevenueCat();
              
              // Wait a moment then try paywall again
              setTimeout(() => testPaywall(), 1000);
            }
          },
          { text: 'Cancel' }
        ]
      );
      return;
    }
    
    await presentPaywallIfNeededWithAlert({
      requiredEntitlement: 'pro',
    });
  }, [presentPaywallIfNeededWithAlert, revenueCatState, revenueCatActions]);

  // RevenueCat debug test function
  const testRevenueCatDebug = useCallback(async () => {
    console.log('🧪 Testing RevenueCat Debug...');
    const { env } = await import('../../config/env');
    const { isTestFlightBuild, getBuildEnvironment } = await import('../../config/revenueCat');
    
    const debugInfo = {
      // Environment info
      buildEnvironment: getBuildEnvironment(),
      isTestFlight: isTestFlightBuild(),
      isDevelopment: __DEV__,
      nodeEnv: process.env.NODE_ENV,
      
      // RevenueCat state
      rcInitialized: revenueCatState.isInitialized,
      rcLoading: revenueCatState.isLoading,
      rcError: revenueCatState.error,
      rcTier: revenueCatState.subscriptionStatus.tier,
      rcHasCustomerInfo: !!revenueCatState.customerInfo,
      
      // API key info
      hasIOSKey: !!env.REVENUE_CAT_API_KEY_IOS,
      iosKeyLength: env.REVENUE_CAT_API_KEY_IOS?.length || 0,
      iosKeyFormat: env.REVENUE_CAT_API_KEY_IOS?.startsWith('appl_') ? 'Valid' : 'Invalid',
      
      // Usage info
      recordingsUsed: revenueCatState.usageInfo.recordingsUsed,
      recordingsLimit: revenueCatState.usageInfo.recordingsLimit,
      recordingsRemaining: revenueCatState.usageInfo.recordingsRemaining,
    };

    console.log('🔍 RevenueCat Debug Info:', debugInfo);

    const debugText = Object.entries(debugInfo)
      .map(([key, value]) => `${key}: ${value}`)
      .join('\n');

    Alert.alert(
      'RevenueCat Debug Info',
      debugText,
      [
        { text: 'Copy to Console', onPress: () => {
          console.log('📋 RevenueCat Debug Info (for copying):', JSON.stringify(debugInfo, null, 2));
        }},
        { text: 'Test Offerings', onPress: async () => {
          console.log('🧪 Testing offerings fetch...');
          try {
            await revenueCatActions.getOfferings();
            Alert.alert('Success', 'Offerings fetched successfully! Check console for details.');
          } catch (error: any) {
            console.error('❌ Offerings test failed:', error);
            Alert.alert('Offerings Error', `Error ${error.code || 'Unknown'}: ${error.message || 'Failed to fetch offerings'}\n\nCheck console for full details.`);
          }
        }},
        { text: 'Full Diagnostic', onPress: async () => {
          console.log('🔬 Running full RevenueCat diagnostic...');
          try {
            const { env } = await import('../../config/env');
            const { isTestFlightBuild, getBuildEnvironment, getPurchasesInstance } = await import('../../config/revenueCat');
            const PurchasesInstance = getPurchasesInstance();
            
            // Comprehensive diagnostic info
            const diagnosticInfo = {
              // Environment
              buildEnvironment: getBuildEnvironment(),
              isTestFlight: isTestFlightBuild(),
              isDevelopment: __DEV__,
              nodeEnv: process.env.NODE_ENV,
              
              // API Keys
              hasIOSKey: !!env.REVENUE_CAT_API_KEY_IOS,
              iosKeyLength: env.REVENUE_CAT_API_KEY_IOS?.length || 0,
              iosKeyFormat: env.REVENUE_CAT_API_KEY_IOS?.startsWith('appl_') ? 'Valid' : 'Invalid',
              iosKeyPreview: env.REVENUE_CAT_API_KEY_IOS?.substring(0, 10) + '...',
              
              // RevenueCat State
              rcInitialized: revenueCatState.isInitialized,
              rcLoading: revenueCatState.isLoading,
              rcError: revenueCatState.error,
              rcTier: revenueCatState.subscriptionStatus.tier,
              rcHasCustomerInfo: !!revenueCatState.customerInfo,
              rcHasOfferings: !!revenueCatState.offerings,
              rcOfferingsCount: revenueCatState.offerings ? Object.keys(revenueCatState.offerings.all).length : 0,
            };
            
            console.log('🔬 Full Diagnostic Results:', diagnosticInfo);
            
            // Try to fetch customer info
            let customerInfoResult = 'Not attempted';
            try {
              const customerInfo = await PurchasesInstance.getCustomerInfo();
              customerInfoResult = `Success - ${customerInfo.activeSubscriptions.length} active subs`;
            } catch (custError: any) {
              customerInfoResult = `Error ${custError.code}: ${custError.message}`;
            }
            
            // Try to fetch offerings
            let offeringsResult = 'Not attempted';
            try {
              const offerings = await PurchasesInstance.getOfferings();
              offeringsResult = `Success - ${Object.keys(offerings.all).length} offerings, current: ${offerings.current?.identifier || 'none'}`;
            } catch (offError: any) {
              offeringsResult = `Error ${offError.code}: ${offError.message}`;
            }
            
            const fullReport = `REVENUECAT DIAGNOSTIC REPORT
            
Environment:
• Build: ${diagnosticInfo.buildEnvironment}
• TestFlight: ${diagnosticInfo.isTestFlight}
• Node Env: ${diagnosticInfo.nodeEnv}

API Key:
• Has Key: ${diagnosticInfo.hasIOSKey}
• Length: ${diagnosticInfo.iosKeyLength}
• Format: ${diagnosticInfo.iosKeyFormat}
• Preview: ${diagnosticInfo.iosKeyPreview}

RevenueCat State:
• Initialized: ${diagnosticInfo.rcInitialized}
• Loading: ${diagnosticInfo.rcLoading}
• Error: ${diagnosticInfo.rcError || 'None'}
• Tier: ${diagnosticInfo.rcTier}
• Has Customer Info: ${diagnosticInfo.rcHasCustomerInfo}

Live Tests:
• Customer Info: ${customerInfoResult}
• Offerings: ${offeringsResult}

Bundle ID: com.basimdcs.calorietracker
Products: com.basimdcs.calorietracker.Monthly, com.basimdcs.calorietracker.Annual`;

            Alert.alert('RevenueCat Diagnostic Report', fullReport, [
              { text: 'Copy to Console', onPress: () => console.log('📋 DIAGNOSTIC REPORT:\n', fullReport) },
              { text: 'Close' }
            ]);
            
          } catch (error: any) {
            console.error('❌ Diagnostic failed:', error);
            Alert.alert('Diagnostic Error', `Failed to run diagnostic: ${error.message}`);
          }
        }},
        { text: 'Retry Init', onPress: () => {
          revenueCatActions.resetInitialization();
          setTimeout(() => {
            revenueCatActions.initializeRevenueCat(profile?.id);
          }, 1000);
        }},
        { text: 'Close' }
      ]
    );
  }, [revenueCatState, revenueCatActions, profile?.id]);

  // Start recording
  const handleStartRecording = useCallback(async () => {
    const usageStats = getCurrentUsageStats();
    
    if (usageStats.monthlyLimit !== null && usageStats.recordingsRemaining !== null && usageStats.recordingsRemaining <= 0) {
      Alert.alert(
        'Recording Limit Reached',
        `You've reached your monthly limit of ${usageStats.monthlyLimit} recordings. Upgrade to PRO for unlimited recordings!`,
        [
          { text: 'Maybe Later', style: 'cancel' },
          { text: 'Upgrade to Pro', onPress: async () => {
            await presentPaywallIfNeededWithAlert({
              requiredEntitlement: 'pro',
            });
          }}
        ]
      );
      return;
    }
    
    await voiceRecording.actions.startRecording();
    if (!voiceRecording.state.error) {
      setVoiceState('recording');
      voiceProcessing.actions.clearError();
    }
  }, [voiceRecording.actions, voiceRecording.state.error, voiceProcessing.actions, getCurrentUsageStats, presentPaywallIfNeededWithAlert]);


  // Stop recording
  const handleStopRecording = useCallback(async () => {
    const audioUri = await voiceRecording.actions.stopRecording();
    
    if (audioUri) {
      setVoiceState('processing');
      const success = await voiceProcessing.actions.processRecording(audioUri, useGPT5);
      
      if (success) {
        console.log('🎉 Processing successful, parsed foods:', voiceProcessing.data.parsedFoods);
        // Processing completed successfully - state will be handled by useEffect
      } else {
        setVoiceState('ready');
      }
    } else {
      setVoiceState('ready');
      if (!voiceRecording.state.error) {
        Alert.alert(
          'Recording Issue',
          'Recording completed but no audio file was generated.',
          [{ text: 'OK' }]
        );
      }
    }
  }, [voiceRecording.actions, voiceProcessing.actions, voiceProcessing.data.parsedFoods, voiceRecording.state.error, useGPT5]);

  // Handle voice processing completion
  useEffect(() => {
    if (voiceProcessing.data.state === 'completed' && voiceProcessing.data.parsedFoods.length > 0) {
      console.log('📋 Setting parsed foods for review:', voiceProcessing.data.parsedFoods);
      setParsedFoods(voiceProcessing.data.parsedFoods);
      setVoiceState('reviewing');
    }
  }, [voiceProcessing.data.state, voiceProcessing.data.parsedFoods]);

  // Food review handlers
  const handleUpdateFood = useCallback((index: number, updatedFood: ParsedFoodItem) => {
    setParsedFoods(prev => {
      const newFoods = [...prev];
      newFoods[index] = updatedFood;
      return newFoods;
    });
  }, []);

  const handleRemoveFood = useCallback((index: number) => {
    setParsedFoods(prev => prev.filter((_, i) => i !== index));
  }, []);

  const handleAddFood = useCallback(() => {
    const newFood: ParsedFoodItem = {
      name: 'New Item',
      calories: 100,
      protein: 5,
      carbs: 15,
      fat: 3,
      confidence: 0.5,
      needsQuantity: true,
      quantity: 1,
      unit: 'pieces',
    };
    setParsedFoods(prev => [...prev, newFood]);
  }, []);

  const handleConfirmFoods = useCallback(async () => {
    try {
      console.log('🍽️ Starting to log foods:', parsedFoods);
      
      // Update current date to ensure we're logging to the right day
      updateCurrentDate();
      
      // Log foods with current date
      
      for (const food of parsedFoods) {
        if (food.name && food.calories > 0) {
          const now = new Date();
          
          // Parse the quantity and unit properly
          const actualQuantity = food.quantity || 1;
          const actualUnit = food.unit || 'serving';
          
          // Normalize nutrition values to per-100g basis for consistent storage
          // The ParsedFoodItem already contains the total nutrition for the specified quantity
          // We need to calculate per-100g values for proper serving size handling
          let nutritionPer100g;
          let servingSize = 100;
          let servingSizeUnit = 'g';
          let quantityMultiplier = 1;
          
          if (actualUnit === 'g' || actualUnit === 'grams') {
            // For gram-based foods, calculate per-100g nutrition
            nutritionPer100g = {
              calories: (food.calories / actualQuantity) * 100,
              protein: (food.protein / actualQuantity) * 100,
              carbs: (food.carbs / actualQuantity) * 100,
              fat: (food.fat / actualQuantity) * 100,
            };
            // The quantity multiplier should be actual grams / 100g
            quantityMultiplier = actualQuantity / 100;
            servingSize = 100;
            servingSizeUnit = 'g';
          } else {
            // For piece-based foods (cups, pieces, etc), use the provided nutrition as-is
            // and treat quantity as serving multiplier
            nutritionPer100g = {
              calories: food.calories,
              protein: food.protein,
              carbs: food.carbs,
              fat: food.fat,
            };
            quantityMultiplier = actualQuantity;
            servingSize = 1;
            servingSizeUnit = actualUnit;
          }

          const foodItem = {
            id: `food_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
            name: food.name,
            nutrition: nutritionPer100g,
            servingSize: servingSize,
            servingSizeUnit: servingSizeUnit,
            isCustom: true,
            createdAt: now.toISOString(),
          };

          console.log('📝 Adding food item:', {
            ...foodItem,
            originalQuantity: actualQuantity,
            originalUnit: actualUnit,
            quantityMultiplier
          });
          
          // Add food item to the store
          addFoodItem(foodItem);
          
          // Log the food consumption
          console.log('📊 Logging food with quantity multiplier:', quantityMultiplier);
          logFood(foodItem.id, quantityMultiplier, 'snacks');
        }
      }

      console.log('✅ All foods logged successfully');

      // Increment recording usage after successful food logging
      incrementRecordingUsage();
      // Also update RevenueCat usage if initialized
      if (revenueCatState.isInitialized) {
        revenueCatActions.updateUsageCount(1);
      }
      console.log('📊 Recording usage incremented after successful food logging');

      // Reset state
      setVoiceState('ready');
      voiceProcessing.actions.reset();
      setParsedFoods([]);
      
      Alert.alert('Success', `${parsedFoods.length} food item${parsedFoods.length !== 1 ? 's' : ''} logged successfully!`);
      
    } catch (error) {
      console.error('❌ Failed to log foods:', error);
      Alert.alert('Error', 'Failed to save food items. Please try again.');
    }
  }, [parsedFoods, addFoodItem, logFood, voiceProcessing.actions, incrementRecordingUsage, updateCurrentDate, revenueCatState.isInitialized, revenueCatActions]);

  const handleCancel = useCallback(() => {
    // Cancel recording if in progress
    voiceRecording.actions.cancelRecording();
    
    // Reset processing state
    voiceProcessing.actions.reset();
    
    // Reset UI state
    setVoiceState('ready');
    setParsedFoods([]);
  }, [voiceRecording.actions, voiceProcessing.actions]);

  const handleClearTranscript = useCallback(() => {
    voiceProcessing.actions.clearTranscript();
    if (voiceState === 'reviewing') {
      setParsedFoods([]);
      setVoiceState('ready');
    }
  }, [voiceState, voiceProcessing.actions]);

  // Two-Way Comparison: GPT-4 vs Gemini
  const compareApproaches = useCallback(async () => {
    const testText = "كلت واحدة زبادي مراعي جريك يوجرد لو فات هي حوالي 170 جرام وكلت معلات تشيا سيدز وكلت وشربت واحدة ستاربوكس ميديام سكيم ميلك";
    console.log('🧪 TWO-WAY COMPARISON: GPT-4 vs Gemini for:', testText);
    console.log('═'.repeat(80));
    
    try {
      setVoiceState('processing');
      
      // Test GPT-4 O3 Approach
      console.log('🔬 TESTING GPT-4 O3 APPROACH...');
      const gpt4Start = Date.now();
      const gpt4Results = await openAIService.parseFoodFromText(testText);
      const gpt4Time = Date.now() - gpt4Start;
      
      // Test Gemini Approach
      console.log('💎 TESTING GEMINI APPROACH...');
      const geminiStart = Date.now();
      const geminiResults = await parseFoodFromTextGemini(testText);
      const geminiTime = Date.now() - geminiStart;
      
      console.log('\n📋 TWO-WAY COMPARISON RESULTS:');
      console.log('═'.repeat(60));
      
      console.log('⏱️ PERFORMANCE:');
      console.log(`GPT-4: ${gpt4Time}ms`);
      console.log(`Gemini: ${geminiTime}ms`);
      
      console.log('\n📊 RESULTS SUMMARY:');
      console.log(`GPT-4 found: ${gpt4Results.length} items`);
      console.log(`Gemini found: ${geminiResults.length} items`);
      
      // Detailed breakdown of each food item
      console.log('\n🍽️ DETAILED FOOD BREAKDOWN:');
      console.log('─'.repeat(40));
      
      // GPT-4 breakdown
      console.log('\n🔬 GPT-4 FOOD ITEMS:');
      gpt4Results.forEach((food, index) => {
        console.log(`\n${index + 1}. ${food.name}`);
        console.log(`   Quantity: ${food.quantity} ${food.unit}`);
        console.log(`   Calories: ${food.calories}`);
        console.log(`   Protein: ${food.protein}g`);
        console.log(`   Carbs: ${food.carbs}g`);
        console.log(`   Fat: ${food.fat}g`);
        console.log(`   Cooking Method: ${food.cookingMethod || 'Not specified'}`);
        console.log(`   Confidence: ${food.confidence}`);
        console.log(`   Needs Quantity: ${food.needsQuantity}`);
        console.log(`   Needs Cooking Method: ${food.needsCookingMethod}`);
        if (food.nutritionNotes) console.log(`   Notes: ${food.nutritionNotes}`);
      });
      
      // Gemini breakdown
      console.log('\n💎 GEMINI FOOD ITEMS:');
      geminiResults.forEach((food, index) => {
        console.log(`\n${index + 1}. ${food.name}`);
        console.log(`   Quantity: ${food.quantity} ${food.unit}`);
        console.log(`   Calories: ${food.calories}`);
        console.log(`   Protein: ${food.protein}g`);
        console.log(`   Carbs: ${food.carbs}g`);
        console.log(`   Fat: ${food.fat}g`);
        console.log(`   Cooking Method: ${food.cookingMethod || 'Not specified'}`);
        console.log(`   Confidence: ${food.confidence}`);
        console.log(`   Needs Quantity: ${food.needsQuantity}`);
        console.log(`   Needs Cooking Method: ${food.needsCookingMethod}`);
        if (food.nutritionNotes) console.log(`   Notes: ${food.nutritionNotes}`);
      });
      
      // Calculate totals for comparison
      const gpt4Totals = gpt4Results.reduce((acc, food) => ({
        calories: acc.calories + (food.calories || 0),
        protein: acc.protein + (food.protein || 0),
        carbs: acc.carbs + (food.carbs || 0),
        fat: acc.fat + (food.fat || 0)
      }), { calories: 0, protein: 0, carbs: 0, fat: 0 });
      
      const geminiTotals = geminiResults.reduce((acc, food) => ({
        calories: acc.calories + (food.calories || 0),
        protein: acc.protein + (food.protein || 0),
        carbs: acc.carbs + (food.carbs || 0),
        fat: acc.fat + (food.fat || 0)
      }), { calories: 0, protein: 0, carbs: 0, fat: 0 });
      
      console.log('\n🧮 NUTRITION TOTALS COMPARISON:');
      console.log(`GPT-4 Totals: ${gpt4Totals.calories} cal, ${gpt4Totals.protein}g protein, ${gpt4Totals.carbs}g carbs, ${gpt4Totals.fat}g fat`);
      console.log(`Gemini Totals: ${geminiTotals.calories} cal, ${geminiTotals.protein}g protein, ${geminiTotals.carbs}g carbs, ${geminiTotals.fat}g fat`);
      
      console.log('\n🔧 FLAGS COMPARISON:');
      console.log('GPT-4 needsQuantity:', gpt4Results.map(f => f.needsQuantity));
      console.log('Gemini needsQuantity:', geminiResults.map(f => f.needsQuantity));
      console.log('GPT-4 needsCookingMethod:', gpt4Results.map(f => f.needsCookingMethod));
      console.log('Gemini needsCookingMethod:', geminiResults.map(f => f.needsCookingMethod));
      
      // Show results in Alert with options to test either
      Alert.alert(
        'GPT-4 vs Gemini Comparison',
        `Test: "${testText}"\n\n⏱️ Performance:\n• GPT-4: ${gpt4Time}ms\n• Gemini: ${geminiTime}ms\n\n📊 Items Found:\n• GPT-4: ${gpt4Results.length}\n• Gemini: ${geminiResults.length}\n\n🧮 Total Calories:\n• GPT-4: ${gpt4Totals.calories}\n• Gemini: ${geminiTotals.calories}\n\n🔧 Flags Working:\n• GPT-4: ${gpt4Results.some(f => f.needsQuantity || f.needsCookingMethod) ? 'YES' : 'NO'}\n• Gemini: ${geminiResults.some(f => f.needsQuantity || f.needsCookingMethod) ? 'YES' : 'NO'}\n\nCheck console for detailed breakdown.`,
        [
          { text: 'Test GPT-4', onPress: () => {
            setParsedFoods(gpt4Results);
            setVoiceState('reviewing');
          }},
          { text: 'Test Gemini', onPress: () => {
            setParsedFoods(geminiResults);
            setVoiceState('reviewing');
          }},
          { text: 'Close', style: 'cancel' }
        ]
      );
      
      setVoiceState('ready');
      
    } catch (error) {
      console.error('❌ Two-way comparison test failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      Alert.alert('Test Failed', `Error: ${errorMessage}`);
      setVoiceState('ready');
    }
  }, []);

  // Test OpenAI 2-step process function
  const testOpenAITwoStepProcess = useCallback(async () => {
    const testText = "half grilled chicken";
    console.log('🧪 Testing 2-Step OpenAI Process for:', testText);
    console.log('═'.repeat(60));
    
    try {
      // Step 1: Parse food items and quantities
      const step1Prompt = `Parse this Arabic/Egyptian Arabic food text and extract food items with their quantities. Convert portions to grams.

Text: ${testText}

Extract:
- Food items 
- Quantities in grams (realistic portion sizes)

Return JSON: [{"name": "food item", "quantity": number_in_grams, "unit": "grams"}]`;

      console.log('📝 Step 1 Prompt:');
      console.log(step1Prompt);
      console.log('\n⏳ Sending Step 1 request...');
      
      const step1Result = await testBasicOpenAIQuery(step1Prompt);
      console.log('\n✅ Step 1 Result:');
      console.log(step1Result);
      
      // Parse the JSON response from Step 1
      let step1Data;
      try {
        // Extract JSON from the response
        const jsonMatch = step1Result.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          step1Data = JSON.parse(jsonMatch[0]);
          console.log('\n📊 Parsed Step 1 Data:', step1Data);
        } else {
          console.log('❌ Could not extract JSON from Step 1 response');
          Alert.alert('Test Error', 'Could not extract JSON from Step 1 response');
          return;
        }
      } catch (parseError) {
        console.log('❌ Error parsing Step 1 JSON:', parseError);
        const errorMessage = parseError instanceof Error ? parseError.message : 'Unknown error';
        Alert.alert('Test Error', `Error parsing Step 1 JSON: ${errorMessage}`);
        return;
      }
      
      // Step 2: Calculate nutrition using Step 1 results
      const foodsList = step1Data.map((f: any) => `- ${f.name}: ${f.quantity}g`).join('\n');
      
      const step2Prompt = `Calculate calories, protein, carbs, and fat for these food items and quantities. Return ONLY JSON, no explanations:

Foods with quantities:
${foodsList}

Return ONLY this JSON format:
[{"name": "food name", "calories": number, "protein": number, "carbs": number, "fat": number, "quantity": number}]`;

      console.log('\n📝 Step 2 Prompt:');
      console.log(step2Prompt);
      console.log('\n⏳ Sending Step 2 request...');
      
      const step2Result = await testBasicOpenAIQuery(step2Prompt);
      console.log('\n✅ Step 2 Result:');
      console.log(step2Result);
      
      // Parse the JSON response from Step 2
      let step2Data;
      try {
        const jsonMatch = step2Result.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          step2Data = JSON.parse(jsonMatch[0]);
          console.log('\n📊 Parsed Step 2 Data:', step2Data);
          
          // Calculate totals
          const totals = step2Data.reduce((acc: any, item: any) => ({
            calories: acc.calories + (item.calories || 0),
            protein: acc.protein + (item.protein || 0),
            carbs: acc.carbs + (item.carbs || 0),
            fat: acc.fat + (item.fat || 0),
            quantity: acc.quantity + (item.quantity || 0)
          }), { calories: 0, protein: 0, carbs: 0, fat: 0, quantity: 0 });
          
          console.log('\n🧮 TOTALS:');
          console.log(`Total Quantity: ${totals.quantity}g`);
          console.log(`Total Calories: ${totals.calories}`);
          console.log(`Total Protein: ${totals.protein}g`);
          console.log(`Total Carbs: ${totals.carbs}g`);
          console.log(`Total Fat: ${totals.fat}g`);
          
          console.log('\n📋 COMPARISON WITH USER REPORT:');
          console.log(`User reported: 700g, 1530 calories, 322g protein`);
          console.log(`API returned: ${totals.quantity}g, ${totals.calories} calories, ${totals.protein}g protein`);
          console.log(`Quantity difference: ${Math.abs(totals.quantity - 700)}g`);
          console.log(`Calories difference: ${Math.abs(totals.calories - 1530)}`);
          console.log(`Protein difference: ${Math.abs(totals.protein - 322)}g`);
          
          // Show results in Alert
          Alert.alert(
            'OpenAI Test Results',
            `Results for "${testText}":
            
🏷️ Step 1 Parsed: ${step1Data.map((f: any) => `${f.name} (${f.quantity}g)`).join(', ')}

📊 Step 2 Totals:
• Quantity: ${totals.quantity}g
• Calories: ${totals.calories}
• Protein: ${totals.protein}g
• Carbs: ${totals.carbs}g 
• Fat: ${totals.fat}g

📋 User vs API:
• User: 700g, 1530 cal, 322g protein
• API: ${totals.quantity}g, ${totals.calories} cal, ${totals.protein}g protein

Check console for detailed logs.`,
            [{ text: 'OK' }]
          );
        } else {
          console.log('❌ Could not extract JSON from Step 2 response');
          Alert.alert('Test Error', 'Could not extract JSON from Step 2 response');
        }
      } catch (parseError) {
        console.log('❌ Error parsing Step 2 JSON:', parseError);
        const errorMessage = parseError instanceof Error ? parseError.message : 'Unknown error';
        Alert.alert('Test Error', `Error parsing Step 2 JSON: ${errorMessage}`);
      }
      
    } catch (error) {
      console.error('❌ Test failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      Alert.alert('Test Failed', `Error: ${errorMessage}`);
    }
  }, []);


  // Show food review screen
  if (voiceState === 'reviewing' && parsedFoods.length > 0) {
    return (
      <SafeAreaView style={styles.container}>
        <FoodReviewNew
          foods={parsedFoods}
          onUpdateFood={handleUpdateFood}
          onRemoveFood={handleRemoveFood}
          onAddFood={handleAddFood}
          onConfirm={handleConfirmFoods}
          onCancel={handleCancel}
          isLoading={false}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader
        title="Voice Food Log 🎤"
        subtitle="Record your meals naturally"
      />
      
      {/* Usage Progress Bar */}
      <View style={styles.usageContainer}>
        <UsageProgressBar usageStats={getCurrentUsageStats()} />
      </View>
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Recording Button */}
          <RecordingButton
            isRecording={voiceRecording.state.isRecording}
            isProcessing={voiceState === 'processing' || voiceProcessing.data.state === 'transcribing' || voiceProcessing.data.state === 'parsing'}
            recordingTime={voiceRecording.state.recordingTime}
            remainingTime={voiceRecording.state.remainingTime}
            onStartRecording={handleStartRecording}
            onStopRecording={handleStopRecording}
            disabled={!voiceRecording.state.isInitialized || voiceState === 'processing' || voiceProcessing.data.state === 'transcribing' || voiceProcessing.data.state === 'parsing'}
          />

          {/* Processing Status */}
          {(voiceProcessing.data.state === 'transcribing' || voiceProcessing.data.state === 'parsing') && (
            <View style={styles.statusCard}>
              <MaterialIcons 
                name={voiceProcessing.data.state === 'transcribing' ? 'hearing' : 'psychology'} 
                size={24} 
                color={colors.primary} 
                style={styles.statusIcon}
              />
              <View style={styles.statusContent}>
                <Text style={styles.statusText}>
                  {voiceProcessing.data.state === 'transcribing' && '🎯 Converting speech to text...'}
                  {voiceProcessing.data.state === 'parsing' && '🤖 Analyzing food items...'}
                </Text>
                {voiceProcessing.data.progress !== undefined && (
                  <View style={styles.progressContainer}>
                    <View style={styles.progressBar}>
                      <View 
                        style={[
                          styles.progressFill, 
                          { width: `${voiceProcessing.data.progress}%` }
                        ]} 
                      />
                    </View>
                    <Text style={styles.progressText}>{voiceProcessing.data.progress}%</Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Error Display */}
          {currentError && (
            <View style={styles.errorCard}>
              <View style={styles.errorContent}>
                <MaterialIcons name="error" size={20} color={colors.error} />
                <Text style={styles.errorText}>{currentError}</Text>
              </View>
              <View style={styles.errorActions}>
                <TouchableOpacity
                  style={styles.retryButton}
                  onPress={() => {
                    voiceRecording.actions.clearError();
                    voiceProcessing.actions.clearError();
                  }}
                >
                  <Text style={styles.retryButtonText}>Dismiss</Text>
                </TouchableOpacity>
                {(voiceProcessing.data.state === 'error' && voiceProcessing.data.transcript) && (
                  <TouchableOpacity
                    style={[styles.retryButton, styles.retryButtonPrimary]}
                    onPress={async () => {
                      // Retry processing with existing transcript
                      const success = await voiceProcessing.actions.retryProcessing(useGPT5);
                      if (success) {
                        // The useEffect will handle state transition to reviewing
                        console.log('🔄 Retry successful, waiting for state update');
                      }
                    }}
                  >
                    <Text style={[styles.retryButtonText, styles.retryButtonTextPrimary]}>Retry</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}

          {/* Transcript Display */}
          <TranscriptDisplay
            transcript={voiceProcessing.data.transcript}
            isVisible={!!voiceProcessing.data.transcript && voiceProcessing.data.state !== 'transcribing'}
            onClear={handleClearTranscript}
          />

          {/* Voice Instructions */}
          <VoiceInstructions
            showExamples={!voiceProcessing.data.transcript && voiceState === 'ready'}
            compact={!!voiceProcessing.data.transcript}
          />

          {/* Status Info - Development Only */}
          {voiceState === 'ready' && !voiceProcessing.data.transcript && (
            <View style={styles.testContainer}>
              {/* AI Model Selection */}
              <TouchableOpacity
                style={[
                  styles.modelToggle,
                  { backgroundColor: useGPT5 ? colors.success : colors.blue50 }
                ]}
                onPress={() => setUseGPT5(!useGPT5)}
              >
                <MaterialIcons 
                  name={useGPT5 ? "auto-awesome" : "psychology"} 
                  size={24} 
                  color={useGPT5 ? colors.white : colors.primary} 
                />
                <View style={styles.modelToggleContent}>
                  <Text style={[
                    styles.modelToggleTitle, 
                    { color: useGPT5 ? colors.white : colors.primary }
                  ]}>
                    {useGPT5 ? '🚀 GPT-5-nano Enhanced' : '📚 GPT-4o Legacy'}
                  </Text>
                  <Text style={[
                    styles.modelToggleSubtitle, 
                    { color: useGPT5 ? colors.white : colors.textSecondary }
                  ]}>
                    {useGPT5 
                      ? 'Advanced reasoning with smart modal logic' 
                      : 'Reliable 2-step parsing (Primary)'
                    }
                  </Text>
                </View>
                <Text style={[
                  styles.modelToggleAction,
                  { color: useGPT5 ? colors.white : colors.primary }
                ]}>
                  Tap to switch
                </Text>
              </TouchableOpacity>
              
              <View style={[styles.testContainer, { backgroundColor: colors.green50, borderColor: colors.success, marginBottom: spacing.md }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm }}>
                  <MaterialIcons name="auto-awesome" size={24} color={colors.success} />
                  <Text style={[styles.statusTitle, { marginLeft: spacing.sm, marginBottom: 0 }]}>🔬 Dual Fallback System</Text>
                </View>
                <Text style={styles.statusSubtitle}>
                  Primary method with automatic fallback + Gemini comparison
                </Text>
              </View>
              
              <TouchableOpacity
                style={styles.testButton}
                onPress={compareApproaches}
              >
                <MaterialIcons name="compare-arrows" size={20} color={colors.primary} />
                <Text style={styles.testButtonText}>🧪 GPT-4 vs Gemini Test</Text>
              </TouchableOpacity>
              <Text style={styles.testDescription}>
                Compare GPT-4 vs Gemini with full Arabic meal description
              </Text>
              
              <TouchableOpacity
                style={[styles.testButton, styles.testButtonPrimary]}
                onPress={testPaywall}
              >
                <MaterialIcons name="payment" size={20} color={colors.white} />
                <Text style={[styles.testButtonText, styles.testButtonTextPrimary]}>🧪 Test RevenueCat Paywall</Text>
              </TouchableOpacity>
              <Text style={styles.testDescription}>
                Test the RevenueCat paywall (remove in production)
              </Text>

              <TouchableOpacity
                style={[styles.testButton, { backgroundColor: colors.warning }]}
                onPress={testRevenueCatDebug}
              >
                <MaterialIcons name="bug-report" size={20} color={colors.white} />
                <Text style={[styles.testButtonText, styles.testButtonTextPrimary]}>🔧 RevenueCat Debug</Text>
              </TouchableOpacity>
              <Text style={styles.testDescription}>
                Debug RevenueCat initialization and configuration issues
              </Text>
            </View>
          )}

        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  usageContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    padding: spacing.lg,
    gap: spacing.lg,
    paddingBottom: spacing.xl,
  },
  statusCard: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  statusSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  statusIcon: {
    color: colors.white,
  },
  statusContent: {
    flex: 1,
    alignItems: 'center',
  },
  statusText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    width: '100%',
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.white,
    borderRadius: 2,
  },
  progressText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '500',
    minWidth: 35,
    textAlign: 'right',
  },
  errorCard: {
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: colors.error,
  },
  errorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    color: colors.error,
  },
  errorActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
  },
  retryButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 6,
    backgroundColor: colors.gray100,
    borderWidth: 1,
    borderColor: colors.gray300,
  },
  retryButtonPrimary: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  retryButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.gray700,
  },
  retryButtonTextPrimary: {
    color: colors.white,
  },
  testContainer: {
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.primary,
    borderStyle: 'dashed',
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.primaryLight,
    borderRadius: 6,
    marginBottom: spacing.xs,
  },
  testButtonPrimary: {
    backgroundColor: colors.primary,
    marginBottom: spacing.sm, // More space after primary button
  },
  testButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  testButtonTextPrimary: {
    color: colors.white,
  },
  testDescription: {
    fontSize: 12,
    color: colors.gray600,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  modelToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: 12,
    marginBottom: spacing.md,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  modelToggleContent: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  modelToggleTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  modelToggleSubtitle: {
    fontSize: 12,
  },
  modelToggleAction: {
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'right',
  },
});

export default VoiceScreenProduction;