/**
 * RevenueCat Integration Test Helper
 * 
 * This utility provides helper functions to test and validate the RevenueCat
 * integration without causing infinite loops or re-render issues.
 */

import { RevenueCatState, RevenueCatActions } from '../hooks/useRevenueCat';

export interface RevenueCatTestResult {
  passed: boolean;
  message: string;
  details?: any;
}

/**
 * Test helper to validate RevenueCat state structure
 */
export const validateRevenueCatState = (state: RevenueCatState): RevenueCatTestResult => {
  try {
    // Check required state properties
    const requiredProps = ['isInitialized', 'isLoading', 'subscriptionStatus', 'usageInfo'];
    const missingProps = requiredProps.filter(prop => !(prop in state));
    
    if (missingProps.length > 0) {
      return {
        passed: false,
        message: `Missing required state properties: ${missingProps.join(', ')}`,
        details: { missingProps, currentState: Object.keys(state) }
      };
    }

    // Check subscription status structure
    const subscriptionRequiredProps = ['isActive', 'tier', 'willRenew', 'isInGracePeriod'];
    const missingSubProps = subscriptionRequiredProps.filter(prop => !(prop in state.subscriptionStatus));
    
    if (missingSubProps.length > 0) {
      return {
        passed: false,
        message: `Missing subscription status properties: ${missingSubProps.join(', ')}`,
        details: { missingSubProps, currentSubscriptionStatus: Object.keys(state.subscriptionStatus) }
      };
    }

    // Check usage info structure
    const usageRequiredProps = ['recordingsUsed', 'recordingsLimit', 'recordingsRemaining', 'resetDate'];
    const missingUsageProps = usageRequiredProps.filter(prop => !(prop in state.usageInfo));
    
    if (missingUsageProps.length > 0) {
      return {
        passed: false,
        message: `Missing usage info properties: ${missingUsageProps.join(', ')}`,
        details: { missingUsageProps, currentUsageInfo: Object.keys(state.usageInfo) }
      };
    }

    // Validate tier values
    const validTiers = ['FREE', 'PRO', 'ELITE'];
    if (!validTiers.includes(state.subscriptionStatus.tier)) {
      return {
        passed: false,
        message: `Invalid subscription tier: ${state.subscriptionStatus.tier}`,
        details: { validTiers, currentTier: state.subscriptionStatus.tier }
      };
    }

    return {
      passed: true,
      message: 'RevenueCat state structure is valid',
      details: { state }
    };
  } catch (error) {
    return {
      passed: false,
      message: `Error validating state: ${error instanceof Error ? error.message : 'Unknown error'}`,
      details: { error, state }
    };
  }
};

/**
 * Test helper to validate RevenueCat actions structure
 */
export const validateRevenueCatActions = (actions: RevenueCatActions): RevenueCatTestResult => {
  try {
    const requiredActions = [
      'initializeRevenueCat',
      'refreshCustomerInfo',
      'purchasePackage',
      'restorePurchases',
      'getOfferings',
      'identifyUser',
      'logoutUser',
      'resetInitialization',
      'updateUsageCount'
    ];
    
    const missingActions = requiredActions.filter(action => !(action in actions));
    
    if (missingActions.length > 0) {
      return {
        passed: false,
        message: `Missing required actions: ${missingActions.join(', ')}`,
        details: { missingActions, currentActions: Object.keys(actions) }
      };
    }

    // Check that all actions are functions
    const nonFunctionActions = requiredActions.filter(action => typeof actions[action as keyof RevenueCatActions] !== 'function');
    
    if (nonFunctionActions.length > 0) {
      return {
        passed: false,
        message: `Non-function actions found: ${nonFunctionActions.join(', ')}`,
        details: { nonFunctionActions }
      };
    }

    return {
      passed: true,
      message: 'RevenueCat actions structure is valid',
      details: { availableActions: Object.keys(actions) }
    };
  } catch (error) {
    return {
      passed: false,
      message: `Error validating actions: ${error instanceof Error ? error.message : 'Unknown error'}`,
      details: { error }
    };
  }
};

/**
 * Comprehensive test function for RevenueCat integration
 */
export const testRevenueCatIntegration = (state: RevenueCatState, actions: RevenueCatActions) => {
  console.log('🧪 Running RevenueCat Integration Tests...');
  
  const stateTest = validateRevenueCatState(state);
  const actionsTest = validateRevenueCatActions(actions);
  
  const results = {
    stateValidation: stateTest,
    actionsValidation: actionsTest,
    overallPassed: stateTest.passed && actionsTest.passed
  };
  
  console.log('📊 Test Results:', {
    'State Validation': stateTest.passed ? '✅ PASS' : '❌ FAIL',
    'Actions Validation': actionsTest.passed ? '✅ PASS' : '❌ FAIL',
    'Overall': results.overallPassed ? '✅ PASS' : '❌ FAIL'
  });
  
  if (!results.overallPassed) {
    console.error('❌ Test Failures:', {
      state: stateTest.passed ? null : stateTest.message,
      actions: actionsTest.passed ? null : actionsTest.message
    });
  } else {
    console.log('✅ All RevenueCat integration tests passed!');
  }
  
  return results;
};

/**
 * Hook stability test - runs multiple times to detect infinite loops
 */
export const testHookStability = async (hookReturnValue: { state: RevenueCatState; actions: RevenueCatActions }, iterations: number = 5): Promise<RevenueCatTestResult> => {
  try {
    console.log(`🔄 Testing hook stability over ${iterations} iterations...`);
    
    const snapshots: any[] = [];
    
    for (let i = 0; i < iterations; i++) {
      await new Promise(resolve => setTimeout(resolve, 100)); // Small delay
      snapshots.push({
        iteration: i + 1,
        isInitialized: hookReturnValue.state.isInitialized,
        isLoading: hookReturnValue.state.isLoading,
        tier: hookReturnValue.state.subscriptionStatus.tier,
        error: hookReturnValue.state.error,
        timestamp: Date.now()
      });
    }
    
    // Check for unexpected state changes
    const firstSnapshot = snapshots[0];
    const inconsistencies = snapshots.filter((snapshot, index) => {
      if (index === 0) return false;
      return JSON.stringify(snapshot) !== JSON.stringify(firstSnapshot);
    });
    
    if (inconsistencies.length > 0) {
      return {
        passed: false,
        message: `Hook state changed unexpectedly ${inconsistencies.length} times during stability test`,
        details: { snapshots, inconsistencies }
      };
    }
    
    return {
      passed: true,
      message: `Hook remained stable over ${iterations} iterations`,
      details: { snapshots }
    };
  } catch (error) {
    return {
      passed: false,
      message: `Stability test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      details: { error }
    };
  }
};

export default {
  validateRevenueCatState,
  validateRevenueCatActions,
  testRevenueCatIntegration,
  testHookStability
};