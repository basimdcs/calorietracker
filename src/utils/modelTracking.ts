/**
 * Model Performance Tracking Utilities
 * Provides comprehensive tracking and analysis of AI model performance
 * for voice transcription and food parsing pipelines
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { ModelUsageSession, ModelPerformanceMetrics } from '../types/aiTypes';

// ============================================================================
// STORAGE KEYS
// ============================================================================

const STORAGE_KEYS = {
  MODEL_STATS: '@model_performance_stats',
  SESSION_HISTORY: '@model_session_history', 
  USER_CORRECTIONS: '@model_user_corrections',
  CONFIDENCE_ACCURACY: '@model_confidence_accuracy'
} as const;

// ============================================================================
// MODEL COST CONSTANTS (USD per token/minute)
// ============================================================================

const MODEL_COSTS = {
  // Transcription models (per minute of audio)
  'whisper': { input: 0.006, output: 0 }, // $0.006 per minute
  'gpt-4o-audio': { input: 0.100, output: 0.400 }, // $0.100 input, $0.400 output per minute
  
  // Text models (per 1K tokens)
  'gpt-4o': { input: 0.0025, output: 0.01 }, // $2.50 input, $10.00 output per 1M tokens
  'gpt-4o-mini': { input: 0.00015, output: 0.0006 }, // $0.150 input, $0.600 output per 1M tokens  
  'gpt-5-nano': { input: 0.002, output: 0.008 }, // Estimated pricing for GPT-5-nano
} as const;

// ============================================================================
// PERFORMANCE TRACKING CLASS
// ============================================================================

class ModelPerformanceTracker {
  private static instance: ModelPerformanceTracker;
  private modelStats: { [key: string]: ModelPerformanceMetrics } = {};
  private sessionHistory: ModelUsageSession[] = [];
  private confidenceAccuracyData: Array<{
    predicted_confidence: number;
    actual_user_needed_modal: boolean;
    timestamp: Date;
    food_type: string;
  }> = [];

  private constructor() {
    this.loadPersistedData();
  }

  public static getInstance(): ModelPerformanceTracker {
    if (!ModelPerformanceTracker.instance) {
      ModelPerformanceTracker.instance = new ModelPerformanceTracker();
    }
    return ModelPerformanceTracker.instance;
  }

  // ========================================================================
  // SESSION TRACKING
  // ========================================================================

  async startSession(transcriptionModel: 'whisper' | 'gpt-4o-audio', nutritionModel: 'gpt-4o' | 'gpt-5-nano'): Promise<string> {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const session: Partial<ModelUsageSession> = {
      session_id: sessionId,
      timestamp: new Date(),
      transcription_model: transcriptionModel,
      nutrition_model: nutritionModel,
      transcription_latency_ms: 0,
      nutrition_latency_ms: 0,
      total_tokens: 0,
      estimated_cost_usd: 0,
      user_needed_modal: false,
      confidence_accurate: true,
      final_foods_count: 0,
      performance_notes: []
    };

    // Store partial session for completion later
    await this.persistSessionStart(sessionId, session);
    console.log(`📈 Started tracking session: ${sessionId}`);
    
    return sessionId;
  }

  async completeSession(sessionId: string, sessionData: Partial<ModelUsageSession>): Promise<void> {
    try {
      const existingSession = await this.getSessionStart(sessionId);
      if (!existingSession) {
        console.warn(`Session ${sessionId} not found for completion`);
        return;
      }

      const completedSession: ModelUsageSession = {
        ...existingSession,
        ...sessionData
      } as ModelUsageSession;

      // Add to session history
      this.sessionHistory.push(completedSession);
      
      // Keep only last 100 sessions to avoid memory bloat
      if (this.sessionHistory.length > 100) {
        this.sessionHistory.shift();
      }

      // Update model stats
      this.updateModelStats(completedSession);
      
      // Calculate and track confidence accuracy
      if (sessionData.user_needed_modal !== undefined) {
        await this.trackConfidenceAccuracy(sessionId, sessionData.user_needed_modal);
      }

      // Persist to storage
      await this.persistData();
      
      console.log(`✅ Completed session: ${sessionId} - ${completedSession.final_foods_count} foods, modal: ${completedSession.user_needed_modal}`);
      
    } catch (error) {
      console.error(`Failed to complete session ${sessionId}:`, error);
    }
  }

  // ========================================================================
  // MODEL PERFORMANCE TRACKING
  // ========================================================================

  trackModelCall(
    model: string, 
    latencyMs: number, 
    tokens?: number, 
    inputTokens?: number,
    outputTokens?: number,
    success: boolean = true
  ): void {
    if (!this.modelStats[model]) {
      this.modelStats[model] = {
        model_name: model,
        total_calls: 0,
        total_tokens: 0,
        total_cost_usd: 0,
        avg_latency_ms: 0,
        success_rate: 1.0,
        confidence_accuracy: 0.5 // Will be updated with user feedback
      };
    }

    const stats = this.modelStats[model];
    
    // Update call statistics
    stats.total_calls += 1;
    stats.total_tokens = (stats.total_tokens || 0) + (tokens || 0);
    
    // Calculate cost
    const cost = this.calculateModelCost(model, inputTokens, outputTokens, latencyMs);
    stats.total_cost_usd += cost;
    
    // Update average latency
    stats.avg_latency_ms = ((stats.avg_latency_ms * (stats.total_calls - 1)) + latencyMs) / stats.total_calls;
    
    // Update success rate
    const successCount = Math.round(stats.success_rate * (stats.total_calls - 1)) + (success ? 1 : 0);
    stats.success_rate = successCount / stats.total_calls;

    console.log(`📊 ${model}: ${latencyMs}ms, $${cost.toFixed(4)}, ${success ? '✅' : '❌'}`);
  }

  private calculateModelCost(model: string, inputTokens?: number, outputTokens?: number, latencyMs?: number): number {
    const costs = MODEL_COSTS[model as keyof typeof MODEL_COSTS];
    if (!costs) return 0;

    // For transcription models, cost is based on audio duration
    if (model === 'whisper' || model === 'gpt-4o-audio') {
      const minutes = (latencyMs || 0) / 60000; // Estimate audio duration from processing time
      return (costs.input * minutes) + (costs.output * minutes);
    }

    // For text models, cost is based on tokens
    const inputCost = ((inputTokens || 0) / 1000) * costs.input;
    const outputCost = ((outputTokens || 0) / 1000) * costs.output;
    return inputCost + outputCost;
  }

  // ========================================================================
  // CONFIDENCE ACCURACY TRACKING
  // ========================================================================

  async trackConfidenceAccuracy(sessionId: string, userNeededModal: boolean): Promise<void> {
    try {
      const session = this.sessionHistory.find(s => s.session_id === sessionId);
      if (!session) return;

      // For now, we'll estimate confidence based on whether modal was needed
      // In a full implementation, this would come from the AI confidence scores
      const estimatedConfidence = userNeededModal ? 0.4 : 0.8;
      
      this.confidenceAccuracyData.push({
        predicted_confidence: estimatedConfidence,
        actual_user_needed_modal: userNeededModal,
        timestamp: new Date(),
        food_type: 'mixed' // Could be enhanced to track specific food types
      });

      // Keep only last 500 confidence tracking points
      if (this.confidenceAccuracyData.length > 500) {
        this.confidenceAccuracyData.shift();
      }

      // Update confidence accuracy for relevant models
      const nutritionModel = session.nutrition_model;
      if (this.modelStats[nutritionModel]) {
        this.modelStats[nutritionModel].confidence_accuracy = this.calculateConfidenceAccuracy();
      }

    } catch (error) {
      console.error('Failed to track confidence accuracy:', error);
    }
  }

  private calculateConfidenceAccuracy(): number {
    if (this.confidenceAccuracyData.length === 0) return 0.5;

    let correctPredictions = 0;
    
    this.confidenceAccuracyData.forEach(point => {
      // Consider prediction correct if:
      // - Low confidence (<0.6) and user needed modal, OR
      // - High confidence (>=0.6) and user didn't need modal
      const predictedNeedsModal = point.predicted_confidence < 0.6;
      if (predictedNeedsModal === point.actual_user_needed_modal) {
        correctPredictions += 1;
      }
    });

    return correctPredictions / this.confidenceAccuracyData.length;
  }

  // ========================================================================
  // USER CORRECTION TRACKING
  // ========================================================================

  async trackUserCorrection(
    foodName: string,
    originalQuantity: number,
    originalUnit: string,
    correctedQuantity: number,
    correctedUnit: string,
    originalGrams: number,
    correctedGrams: number
  ): Promise<void> {
    try {
      const correction = {
        food_name: foodName,
        original_quantity: originalQuantity,
        original_unit: originalUnit,
        corrected_quantity: correctedQuantity,
        corrected_unit: correctedUnit,
        original_grams: originalGrams,
        corrected_grams: correctedGrams,
        correction_ratio: correctedGrams / originalGrams,
        timestamp: new Date()
      };

      const corrections = await this.getUserCorrections();
      corrections.push(correction);

      // Keep only last 200 corrections
      if (corrections.length > 200) {
        corrections.shift();
      }

      await AsyncStorage.setItem(STORAGE_KEYS.USER_CORRECTIONS, JSON.stringify(corrections));
      
      console.log(`📝 User correction tracked: ${foodName} ${originalGrams}g → ${correctedGrams}g`);
      
    } catch (error) {
      console.error('Failed to track user correction:', error);
    }
  }

  // ========================================================================
  // DATA ACCESS METHODS
  // ========================================================================

  getModelStats(): { [key: string]: ModelPerformanceMetrics } {
    return { ...this.modelStats };
  }

  getSessionHistory(): ModelUsageSession[] {
    return [...this.sessionHistory];
  }

  getSessionSummary() {
    const totalSessions = this.sessionHistory.length;
    const modalSessions = this.sessionHistory.filter(s => s.user_needed_modal).length;
    const avgFoodsPerSession = totalSessions > 0 
      ? this.sessionHistory.reduce((sum, s) => sum + s.final_foods_count, 0) / totalSessions 
      : 0;

    const totalCost = Object.values(this.modelStats).reduce((sum, stats) => sum + stats.total_cost_usd, 0);
    const avgLatency = Object.values(this.modelStats).reduce((sum, stats) => sum + stats.avg_latency_ms, 0) / Object.keys(this.modelStats).length || 0;

    return {
      total_sessions: totalSessions,
      modal_trigger_rate: totalSessions > 0 ? (modalSessions / totalSessions) * 100 : 0,
      avg_foods_per_session: Math.round(avgFoodsPerSession * 10) / 10,
      total_cost_usd: Math.round(totalCost * 1000) / 1000,
      avg_latency_ms: Math.round(avgLatency),
      models_used: Object.keys(this.modelStats),
      confidence_accuracy: this.calculateConfidenceAccuracy() * 100
    };
  }

  async getPerformanceReport(): Promise<string> {
    const summary = this.getSessionSummary();
    const corrections = await this.getUserCorrections();
    
    return `
📊 MODEL PERFORMANCE REPORT
═══════════════════════════════

🎯 Overall Performance:
• Total Sessions: ${summary.total_sessions}
• Modal Trigger Rate: ${summary.modal_trigger_rate.toFixed(1)}%
• Confidence Accuracy: ${summary.confidence_accuracy.toFixed(1)}%
• Avg Foods/Session: ${summary.avg_foods_per_session}

💰 Cost Analysis:
• Total Cost: $${summary.total_cost_usd.toFixed(3)}
• Avg Latency: ${summary.avg_latency_ms}ms
• Cost/Session: $${(summary.total_cost_usd / Math.max(summary.total_sessions, 1)).toFixed(4)}

🤖 Model Breakdown:
${Object.entries(this.modelStats).map(([model, stats]) => `
• ${model}:
  - Calls: ${stats.total_calls}
  - Avg Latency: ${Math.round(stats.avg_latency_ms)}ms
  - Success Rate: ${(stats.success_rate * 100).toFixed(1)}%
  - Total Cost: $${stats.total_cost_usd.toFixed(4)}
`).join('')}

📝 User Corrections: ${corrections.length} tracked
    `;
  }

  // ========================================================================
  // DATA PERSISTENCE
  // ========================================================================

  private async loadPersistedData(): Promise<void> {
    try {
      const [statsJson, sessionsJson, correctionsJson] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.MODEL_STATS),
        AsyncStorage.getItem(STORAGE_KEYS.SESSION_HISTORY),
        AsyncStorage.getItem(STORAGE_KEYS.CONFIDENCE_ACCURACY)
      ]);

      if (statsJson) {
        this.modelStats = JSON.parse(statsJson);
      }

      if (sessionsJson) {
        this.sessionHistory = JSON.parse(sessionsJson).map((s: any) => ({
          ...s,
          timestamp: new Date(s.timestamp)
        }));
      }

      if (correctionsJson) {
        this.confidenceAccuracyData = JSON.parse(correctionsJson).map((c: any) => ({
          ...c,
          timestamp: new Date(c.timestamp)
        }));
      }

      console.log('📊 Loaded model performance data from storage');
      
    } catch (error) {
      console.error('Failed to load persisted model data:', error);
    }
  }

  private async persistData(): Promise<void> {
    try {
      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEYS.MODEL_STATS, JSON.stringify(this.modelStats)),
        AsyncStorage.setItem(STORAGE_KEYS.SESSION_HISTORY, JSON.stringify(this.sessionHistory)),
        AsyncStorage.setItem(STORAGE_KEYS.CONFIDENCE_ACCURACY, JSON.stringify(this.confidenceAccuracyData))
      ]);
    } catch (error) {
      console.error('Failed to persist model performance data:', error);
    }
  }

  private async persistSessionStart(sessionId: string, session: Partial<ModelUsageSession>): Promise<void> {
    try {
      await AsyncStorage.setItem(`@session_start_${sessionId}`, JSON.stringify(session));
    } catch (error) {
      console.error(`Failed to persist session start for ${sessionId}:`, error);
    }
  }

  private async getSessionStart(sessionId: string): Promise<Partial<ModelUsageSession> | null> {
    try {
      const sessionJson = await AsyncStorage.getItem(`@session_start_${sessionId}`);
      if (sessionJson) {
        const session = JSON.parse(sessionJson);
        // Clean up the temporary storage
        await AsyncStorage.removeItem(`@session_start_${sessionId}`);
        return {
          ...session,
          timestamp: new Date(session.timestamp)
        };
      }
    } catch (error) {
      console.error(`Failed to get session start for ${sessionId}:`, error);
    }
    return null;
  }

  private async getUserCorrections(): Promise<any[]> {
    try {
      const correctionsJson = await AsyncStorage.getItem(STORAGE_KEYS.USER_CORRECTIONS);
      return correctionsJson ? JSON.parse(correctionsJson).map((c: any) => ({
        ...c,
        timestamp: new Date(c.timestamp)
      })) : [];
    } catch (error) {
      console.error('Failed to get user corrections:', error);
      return [];
    }
  }

  // ========================================================================
  // UTILITY METHODS
  // ========================================================================

  async clearAllData(): Promise<void> {
    try {
      await Promise.all([
        AsyncStorage.removeItem(STORAGE_KEYS.MODEL_STATS),
        AsyncStorage.removeItem(STORAGE_KEYS.SESSION_HISTORY),
        AsyncStorage.removeItem(STORAGE_KEYS.USER_CORRECTIONS),
        AsyncStorage.removeItem(STORAGE_KEYS.CONFIDENCE_ACCURACY)
      ]);
      
      this.modelStats = {};
      this.sessionHistory = [];
      this.confidenceAccuracyData = [];
      
      console.log('🗑️ Cleared all model performance data');
    } catch (error) {
      console.error('Failed to clear model performance data:', error);
    }
  }

  async exportData(): Promise<object> {
    return {
      modelStats: this.modelStats,
      sessionHistory: this.sessionHistory,
      confidenceAccuracy: this.confidenceAccuracyData,
      summary: this.getSessionSummary(),
      userCorrections: await this.getUserCorrections(),
      exportedAt: new Date().toISOString()
    };
  }
}

// ============================================================================
// SINGLETON INSTANCE AND EXPORTS
// ============================================================================

const modelTracker = ModelPerformanceTracker.getInstance();

export { ModelPerformanceTracker, modelTracker };

// Convenience functions for easier usage
export const trackModelCall = (
  model: string, 
  latencyMs: number, 
  tokens?: number, 
  inputTokens?: number, 
  outputTokens?: number,
  success?: boolean
) => modelTracker.trackModelCall(model, latencyMs, tokens, inputTokens, outputTokens, success);

export const startTrackingSession = (transcriptionModel: 'whisper' | 'gpt-4o-audio', nutritionModel: 'gpt-4o' | 'gpt-5-nano') => 
  modelTracker.startSession(transcriptionModel, nutritionModel);

export const completeTrackingSession = (sessionId: string, sessionData: Partial<ModelUsageSession>) => 
  modelTracker.completeSession(sessionId, sessionData);

export const trackUserCorrection = (
  foodName: string,
  originalQuantity: number,
  originalUnit: string,
  correctedQuantity: number,
  correctedUnit: string,
  originalGrams: number,
  correctedGrams: number
) => modelTracker.trackUserCorrection(
  foodName, originalQuantity, originalUnit, correctedQuantity, correctedUnit, originalGrams, correctedGrams
);

export const getModelStats = () => modelTracker.getModelStats();
export const getSessionSummary = () => modelTracker.getSessionSummary();
export const getPerformanceReport = () => modelTracker.getPerformanceReport();