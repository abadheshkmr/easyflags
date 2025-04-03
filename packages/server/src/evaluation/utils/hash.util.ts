import { createHash } from 'crypto';
import { EvaluationContext } from '../interfaces/evaluation.interface';

/**
 * A fast implementation of MurmurHash3 for consistent hash generation
 * Used for percentage rollouts to ensure consistent user bucketing
 */
export function murmurHash3(str: string): number {
  let h1 = 0x12345678;
  const c1 = 0xcc9e2d51;
  const c2 = 0x1b873593;
  const r1 = 15;
  const r2 = 13;
  const m = 5;
  const n = 0xe6546b64;
  
  const data = new TextEncoder().encode(str);
  const len = data.length;
  let i = 0;
  
  while (i <= len - 4) {
    let k = data[i] | (data[i + 1] << 8) | (data[i + 2] << 16) | (data[i + 3] << 24);
    
    k = Math.imul(k, c1);
    k = (k << r1) | (k >>> (32 - r1));
    k = Math.imul(k, c2);
    
    h1 ^= k;
    h1 = (h1 << r2) | (h1 >>> (32 - r2));
    h1 = Math.imul(h1, m) + n;
    
    i += 4;
  }
  
  // Remaining bytes
  let k = 0;
  switch (len - i) {
    case 3:
      k ^= data[i + 2] << 16;
    case 2:
      k ^= data[i + 1] << 8;
    case 1:
      k ^= data[i];
      k = Math.imul(k, c1);
      k = (k << r1) | (k >>> (32 - r1));
      k = Math.imul(k, c2);
      h1 ^= k;
  }
  
  // Finalization
  h1 ^= len;
  h1 ^= h1 >>> 16;
  h1 = Math.imul(h1, 0x85ebca6b);
  h1 ^= h1 >>> 13;
  h1 = Math.imul(h1, 0xc2b2ae35);
  h1 ^= h1 >>> 16;
  
  return h1;
}

/**
 * Convert a hash value to a percentage (1-100)
 */
export function hashToPercentage(hash: number): number {
  return (Math.abs(hash) % 100) + 1;
}

/**
 * Generate a percentage hash for a user ID and rule ID
 */
export function hashForPercentage(ruleId: string, userId: string): number {
  const hash = murmurHash3(`${ruleId}:${userId}`);
  return hashToPercentage(hash);
}

/**
 * Hash an evaluation context for cache keys
 * Only includes relevant properties to maximize cache hits
 */
export function hashContext(context: EvaluationContext): string {
  return createHash('md5')
    .update(JSON.stringify(sanitizeContext(context)))
    .digest('hex');
}

/**
 * Sanitize context to only include properties likely to affect evaluation
 * This improves cache hit rates by ignoring irrelevant properties
 */
export function sanitizeContext(context: EvaluationContext): Record<string, any> {
  const result: Record<string, any> = {};
  const keysToKeep = ['userId', 'userRole', 'userGroups', 'deviceType', 'location', 'tenantId'];
  
  for (const key of keysToKeep) {
    if (context[key] !== undefined) {
      result[key] = context[key];
    }
  }
  
  return result;
}

/**
 * Extract a nested property using dot notation
 */
export function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((o, i) => (o === undefined || o === null ? undefined : o[i]), obj);
}
