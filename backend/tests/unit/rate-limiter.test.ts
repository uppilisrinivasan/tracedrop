/**
 * Unit Tests: Rate Limiter & Token Management
 * Tests rate limiting behavior and quota enforcement
 */

describe('Rate Limiter', () => {
  describe('Per-Second Rate Limiting', () => {
    test('Allows 10 requests per second', async () => {
      const limiter = createRateLimiter({ rps: 10 });
      const requests = Array(10).fill(null).map(() => limiter.checkLimit('user1'));
      const results = await Promise.all(requests);
      expect(results.every(r => r === true)).toBe(true);
    });

    test('Rejects 11th request in same second', async () => {
      const limiter = createRateLimiter({ rps: 10 });
      const requests = Array(11).fill(null).map(() => limiter.checkLimit('user1'));
      const results = await Promise.all(requests);
      
      expect(results.filter(r => r === true).length).toBe(10);
      expect(results.filter(r => r === false).length).toBe(1);
    });

    test('Resets quota after 1 second', async () => {
      const limiter = createRateLimiter({ rps: 10 });
      
      // Use up quota
      for (let i = 0; i < 10; i++) {
        await limiter.checkLimit('user1');
      }
      
      // 11th request blocked
      expect(await limiter.checkLimit('user1')).toBe(false);
      
      // After 1 second, quota resets
      await sleep(1100);
      expect(await limiter.checkLimit('user1')).toBe(true);
    });

    test('Per-user rate limiting (isolation)', async () => {
      const limiter = createRateLimiter({ rps: 10 });
      
      // User 1: 10 requests
      for (let i = 0; i < 10; i++) {
        await limiter.checkLimit('user1');
      }
      
      // User 2: Should have fresh quota
      expect(await limiter.checkLimit('user2')).toBe(true);
      expect(await limiter.checkLimit('user2')).toBe(true);
    });
  });

  describe('Daily Token Budget', () => {
    test('Allocates 100k tokens per day per user', async () => {
      const limiter = createRateLimiter({ tokensPerDay: 100000 });
      const budget = limiter.getBudget('user1');
      expect(budget.allocated).toBe(100000);
    });

    test('Deducts tokens for API calls', async () => {
      const limiter = createRateLimiter({ tokensPerDay: 100000 });
      await limiter.consumeTokens('user1', 1000); // 1k tokens
      
      const budget = limiter.getBudget('user1');
      expect(budget.remaining).toBe(99000);
    });

    test('Rejects request exceeding daily token budget', async () => {
      const limiter = createRateLimiter({ tokensPerDay: 1000 });
      
      // Try to use 1100 tokens (exceeds budget)
      const result = await limiter.consumeTokens('user1', 1100);
      expect(result).toBe(false);
    });

    test('Resets daily budget at midnight UTC', async () => {
      const limiter = createRateLimiter({ tokensPerDay: 1000 });
      
      // Consume all tokens
      await limiter.consumeTokens('user1', 1000);
      expect(await limiter.consumeTokens('user1', 1)).toBe(false);
      
      // Simulate next day
      await limiter.advanceDay();
      expect(await limiter.consumeTokens('user1', 500)).toBe(true);
    });

    test('Tracks usage across multiple users', async () => {
      const limiter = createRateLimiter({ tokensPerDay: 10000 });
      
      await limiter.consumeTokens('user1', 5000);
      await limiter.consumeTokens('user2', 3000);
      
      const usage = limiter.getGlobalUsage();
      expect(usage.totalConsumed).toBe(8000);
    });
  });

  describe('Anthropic API Quota Management', () => {
    test('Tracks separate quota for LLM calls', async () => {
      const limiter = createRateLimiter({
        llmCallsPerDay: 1000,
        tokensPerDay: 100000
      });
      
      const budget = limiter.getLLMBudget('user1');
      expect(budget.calls).toBe(1000);
      expect(budget.tokens).toBe(100000);
    });

    test('Message generation consumes both call and token quota', async () => {
      const limiter = createRateLimiter({
        llmCallsPerDay: 100,
        tokensPerDay: 50000
      });
      
      // Mock: generating message = 1 call + 500 tokens
      await limiter.recordLLMCall('user1', { calls: 1, tokens: 500 });
      
      const budget = limiter.getLLMBudget('user1');
      expect(budget.calls).toBe(99);
      expect(budget.tokens).toBe(49500);
    });

    test('Prevents excessive LLM usage per finding', async () => {
      const limiter = createRateLimiter({
        llmCallsPerFinding: 5 // max 5 retries per finding
      });
      
      const result = limiter.checkLLMLimit('finding1');
      expect(result).toBe(true); // First call OK
      
      // Exhaust limit
      for (let i = 0; i < 4; i++) {
        await limiter.recordLLMCall('finding1');
      }
      
      expect(limiter.checkLLMLimit('finding1')).toBe(false); // 6th call blocked
    });
  });

  describe('Circuit Breaker Pattern', () => {
    test('Opens circuit after 5 consecutive failures', () => {
      const breaker = createCircuitBreaker({ failureThreshold: 5 });
      
      for (let i = 0; i < 5; i++) {
        breaker.recordFailure();
      }
      
      expect(breaker.isOpen()).toBe(true);
      expect(breaker.checkLimit()).toBe(false); // Rejects further calls
    });

    test('Half-open state allows test request after timeout', async () => {
      const breaker = createCircuitBreaker({ 
        failureThreshold: 5,
        resetTimeout: 1000
      });
      
      // Open circuit
      for (let i = 0; i < 5; i++) {
        breaker.recordFailure();
      }
      
      // Wait for timeout
      await sleep(1100);
      
      expect(breaker.isHalfOpen()).toBe(true);
      expect(breaker.checkLimit()).toBe(true); // Allows test request
    });

    test('Closes circuit on success', () => {
      const breaker = createCircuitBreaker({ failureThreshold: 5 });
      
      // Open circuit
      for (let i = 0; i < 5; i++) {
        breaker.recordFailure();
      }
      
      // Recover
      breaker.recordSuccess();
      expect(breaker.isClosed()).toBe(true);
    });
  });

  describe('Quota Exceeded Behavior', () => {
    test('Returns 429 status when RPS limit exceeded', async () => {
      const limiter = createRateLimiter({ rps: 10 });
      
      for (let i = 0; i < 10; i++) {
        await limiter.checkLimit('user1');
      }
      
      const response = await limiter.checkLimitWithResponse('user1');
      expect(response.status).toBe(429);
      expect(response.headers['retry-after']).toBeDefined();
    });

    test('Returns 429 status when daily token budget exceeded', async () => {
      const limiter = createRateLimiter({ tokensPerDay: 1000 });
      await limiter.consumeTokens('user1', 1000);
      
      const response = await limiter.checkBudgetWithResponse('user1', 100);
      expect(response.status).toBe(429);
    });
  });
});

// Helper functions
function createRateLimiter(config: any) {
  return {};
}

function createCircuitBreaker(config: any) {
  return {};
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
