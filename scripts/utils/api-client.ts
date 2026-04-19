/**
 * API-Football v3 client
 * Base URL: https://v3.football.api-sports.io/
 * Auth: x-apisports-key header
 *
 * Features:
 * - 300 req/min token-bucket rate limiter (Pro plan)
 * - 3 retries with exponential backoff on 429
 * - Per-call logging: endpoint + params + response time
 * - Typed ApiError with HTTP status code
 */

const BASE_URL = 'https://v3.football.api-sports.io'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ApiClient {
  get<T>(path: string, params?: Record<string, string>): Promise<T>
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

interface ApiResponse<T> {
  response: T
  errors: Record<string, string> | string[]
  results: number
  paging?: { current: number; total: number }
}

// ---------------------------------------------------------------------------
// Token-bucket rate limiter (10 req / 60 s)
// ---------------------------------------------------------------------------

class TokenBucket {
  private tokens: number
  private lastRefill: number
  private readonly capacity: number
  private readonly refillRateMs: number // ms per token

  constructor(capacity: number, windowMs: number) {
    this.capacity = capacity
    this.tokens = capacity
    this.lastRefill = Date.now()
    this.refillRateMs = windowMs / capacity
  }

  async consume(): Promise<void> {
    this.refill()
    if (this.tokens >= 1) {
      this.tokens -= 1
      return
    }
    // Wait until next token is available
    const waitMs = this.refillRateMs - (Date.now() - this.lastRefill)
    await sleep(Math.max(waitMs, 0))
    this.refill()
    this.tokens -= 1
  }

  private refill(): void {
    const now = Date.now()
    const elapsed = now - this.lastRefill
    const newTokens = Math.floor(elapsed / this.refillRateMs)
    if (newTokens > 0) {
      this.tokens = Math.min(this.capacity, this.tokens + newTokens)
      this.lastRefill = now
    }
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function buildUrl(path: string, params?: Record<string, string>): string {
  const url = new URL(`${BASE_URL}${path.startsWith('/') ? path : `/${path}`}`)
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value)
    }
  }
  return url.toString()
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

export function createApiClient(apiKey: string): ApiClient {
  if (!apiKey) {
    throw new Error('API_FOOTBALL_KEY is missing. Add it to .env.local.')
  }

  // 300 requests per 60 000 ms (Pro plan)
  const bucket = new TokenBucket(300, 60_000)

  async function get<T>(
    path: string,
    params?: Record<string, string>,
  ): Promise<T> {
    const url = buildUrl(path, params)
    const maxRetries = 3

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      await bucket.consume()

      const start = Date.now()
      const paramsStr = params ? JSON.stringify(params) : '{}'
      process.stdout.write(`[api-football] GET ${path} ${paramsStr} ... `)

      let response: Response
      try {
        response = await fetch(url, {
          headers: {
            'x-apisports-key': apiKey,
          },
        })
      } catch (err) {
        const elapsed = Date.now() - start
        console.error(`NETWORK ERROR (${elapsed}ms):`, err)
        if (attempt === maxRetries) throw err
        await sleep(2 ** attempt * 1_000)
        continue
      }

      const elapsed = Date.now() - start

      if (response.status === 429) {
        const retryAfter = parseInt(response.headers.get('retry-after') ?? '60', 10)
        const waitMs = retryAfter * 1_000
        console.warn(`429 rate limit (attempt ${attempt}/${maxRetries}) — waiting ${retryAfter}s`)
        if (attempt === maxRetries) {
          throw new ApiError(429, 'Rate limit exceeded after max retries')
        }
        await sleep(waitMs)
        continue
      }

      if (!response.ok) {
        console.error(`${response.status} (${elapsed}ms)`)
        throw new ApiError(
          response.status,
          `API-Football error: ${response.status} ${response.statusText} for ${path}`,
        )
      }

      const json = (await response.json()) as ApiResponse<T>

      // API-Football returns errors inside a 200 response body
      const hasErrors =
        Array.isArray(json.errors)
          ? json.errors.length > 0
          : Object.keys(json.errors ?? {}).length > 0

      if (hasErrors) {
        const errMsg = Array.isArray(json.errors)
          ? json.errors.join(', ')
          : Object.values(json.errors).join(', ')
        console.error(`API error (${elapsed}ms): ${errMsg}`)
        throw new ApiError(200, `API-Football returned errors: ${errMsg}`)
      }

      console.log(`${response.status} OK (${elapsed}ms) — ${json.results ?? 0} results`)
      return json.response
    }

    // TypeScript requires an explicit throw after the loop (unreachable in practice)
    throw new ApiError(0, 'Unexpected exit from retry loop')
  }

  return { get }
}

// ---------------------------------------------------------------------------
// CLI self-test (run with: npx ts-node scripts/utils/api-client.ts)
// ---------------------------------------------------------------------------

if (require.main === module) {
  // Load .env.local manually for script execution
  const fs = require('fs')
  const path = require('path')

  const envPath = path.resolve(process.cwd(), '.env.local')
  if (fs.existsSync(envPath)) {
    const lines: string[] = fs.readFileSync(envPath, 'utf-8').split('\n')
    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const eqIdx = trimmed.indexOf('=')
      if (eqIdx === -1) continue
      const key = trimmed.slice(0, eqIdx).trim()
      const value = trimmed.slice(eqIdx + 1).trim()
      if (!process.env[key]) process.env[key] = value
    }
  }

  const apiKey = process.env.API_FOOTBALL_KEY ?? ''
  try {
    createApiClient(apiKey)
    console.log('API client ready')
  } catch (err) {
    console.error((err as Error).message)
    process.exit(1)
  }
}
