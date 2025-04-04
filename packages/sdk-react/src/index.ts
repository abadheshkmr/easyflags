/**
 * React SDK for Feature Flag Service
 * Provides React components and hooks for working with feature flags
 */

export {
  FeatureFlagProvider,
  useFeatureFlag,
  useFeatureFlagReady,
  useFeatureFlagClient,
  useTenantId,
  withFeatureFlag,
  FeatureFlag
} from './provider';

// Re-export types from JavaScript SDK for convenience
export type {
  FeatureFlagOptions,
  FlagValue,
  EvaluationContext
} from '@feature-flag-service/sdk-js'; 