/**
 * Rate Limiter - Request and Token Budget Management
 * Uses in-memory tracking with daily reset for token budget
 */

import { RateLimiterConfig, RateLimiterStatus, RateLimitError } from '../types/agents';

export class RateLimiter {
  private config: RateLimiterConfig;
  private tokensUsedToday: number = 0;
  private lastResetTime: number = Date.now();
  private requestsThisSecond: number = 0;
  private lastSecond: number = Math.floor(Date.now() / 1000);
  private backoffMultiplier: number = 1;
  private backoffUntil: number = 0;

  constructor(config: RateLimiterConfig) {
    this.config = config;
  }

  /**
   * Check if a request can be scheduled
   */
  async canScheduleRequest(estimatedTokens: number): Promise<boolean> {
    this.resetDailyBudgetIfNeeded();

    // Check backoff
    if (Date.now() < this.backoffUntil) {
      return false;
    }

    // Check token budget
    if (this.tokensUsedToday + estimatedTokens > this.config.dailyTokenLimit) {
      return false;
    }

    // Check RPS limit
    const now = Math.floor(Date.now() / 1000);
    if (now !== this.lastSecond) {
      this.lastSecond = now;
      this.requestsThisSecond = 0;
    }

    return this.requestsThisSecond < this.config.rpsLimit;
  }

  /**
   * Schedule a request with rate limiting
   */
  async schedule<T>(
    fn: () => Promise<T>,
    estimatedTokens: number = 100
  ): Promise<T> {
    // Wait until we can make the request
    let waitTime = 0;
    const maxWaitTime = 60000; // Max 60 seconds wait

    while (!await this.canScheduleRequest(estimatedTokens)) {
      if (waitTime > maxWaitTime) {
        throw new RateLimitError(
          'Rate limit: max wait time exceeded',
          Math.ceil((this.backoffUntil - Date.now()) / 1000)
        );
      }

      await this.sleep(100);
      waitTime += 100;
    }

    // Update counters
    this.requestsThisSecond++;

    try {
      const result = await fn();
      // Reset backoff on success
      this.backoffMultiplier = 1;
      this.backoffUntil = 0;
      return result;
    } catch (error: any) {
      // Handle rate limit errors with exponential backoff
      if (error.status === 429) {
        this.activateBackoff(error.retry_after_ms);
      }
      throw error;
    }
  }

  /**
   * Record tokens used for a completed request
   */
  recordTokens(tokensUsed: number): void {
    this.resetDailyBudgetIfNeeded();
    this.tokensUsedToday += tokensUsed;
  }

  /**
   * Get current rate limiter status
   */
  getStatus(): RateLimiterStatus {
    this.resetDailyBudgetIfNeeded();

    const now = Math.floor(Date.now() / 1000);
    const requestsRemaining = this.config.rpsLimit - (now === this.lastSecond ? this.requestsThisSecond : 0);

    return {
      tokensUsedToday: this.tokensUsedToday,
      tokensRemaining: Math.max(0, this.config.dailyTokenLimit - this.tokensUsedToday),
      requestsThisSecond: this.requestsThisSecond,
      requestsRemaining: Math.max(0, requestsRemaining),
      nextReset: this.getNextResetTime().toISOString(),
      backoffActive: Date.now() < this.backoffUntil,
    };
  }

  /**
   * Get estimated delay for given token count
   */
  estimateDelay(tokens: number): number {
    const tokensPerSecond = (this.config.dailyTokenLimit / (24 * 60 * 60));
    const secondsNeeded = tokens / tokensPerSecond;
    return secondsNeeded * 1000; // Convert to ms
  }

  /**
   * Reset daily budget if 24 hours have passed
   */
  private resetDailyBudgetIfNeeded(): void {
    const now = Date.now();
    const hoursSinceReset = (now - this.lastResetTime) / (1000 * 60 * 60);

    if (hoursSinceReset >= 24) {
      this.tokensUsedToday = 0;
      this.lastResetTime = now;
    }
  }

  /**
   * Activate exponential backoff on rate limit
   */
  private activateBackoff(retryAfterMs?: number): void {
    const baseDelay = retryAfterMs || (1000 * this.backoffMultiplier);
    this.backoffUntil = Date.now() + baseDelay;
    this.backoffMultiplier = Math.min(this.backoffMultiplier * 2, 32); // Max 32x multiplier
  }

  /**
   * Get next reset time
   */
  private getNextResetTime(): Date {
    const reset = new Date(this.lastResetTime);
    reset.setHours(reset.getHours() + 24);
    return reset;
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export factory
export function createRateLimiter(config: Partial<RateLimiterConfig> = {}): RateLimiter {
  return new RateLimiter({
    rpsLimit: config.rpsLimit || 10,
    dailyTokenLimit: config.dailyTokenLimit || 100000,
    modelName: config.modelName || 'claude-3-5-sonnet-20241022',
    exponentialBackoff: config.exponentialBackoff !== false,
  });
}
