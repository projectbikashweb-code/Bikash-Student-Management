// Simple in-memory rate limiter for auth routes
// In production, replace with upstash/ratelimit or Redis-based solution

const attempts = new Map<string, { count: number; resetAt: number }>()

export function checkRateLimit(identifier: string, maxAttempts = 5, windowMs = 60_000): { allowed: boolean; remaining: number } {
  const now = Date.now()
  const record = attempts.get(identifier)

  if (!record || now > record.resetAt) {
    attempts.set(identifier, { count: 1, resetAt: now + windowMs })
    return { allowed: true, remaining: maxAttempts - 1 }
  }

  if (record.count >= maxAttempts) {
    return { allowed: false, remaining: 0 }
  }

  record.count++
  return { allowed: true, remaining: maxAttempts - record.count }
}

// Cleanup old entries periodically
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    for (const [key, val] of attempts.entries()) {
      if (now > val.resetAt) attempts.delete(key)
    }
  }, 5 * 60 * 1000)
}
