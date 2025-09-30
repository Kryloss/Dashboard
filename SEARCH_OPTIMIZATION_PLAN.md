# Search Optimization Strategy
**Goal**: Sub-500ms search response with 3 external data sources

## Current Performance Bottlenecks

### Critical (Blocking User Experience)
1. **Parallel API Wait** - Waiting for slowest API (USDA can be 2-3s)
2. **No Caching** - Every search makes fresh network calls
3. **CNF Cold Start** - First search loads/parses ~5MB of CSV
4. **No Request Cancellation** - Typing "chicken" triggers 7 searches
5. **Heavy Deduplication** - O(n²) nested loops on every search

### Secondary
6. **No Progressive Loading** - Results appear all-at-once or not at all
7. **No Skeleton UI** - Blank screen while waiting
8. **Main Thread Blocking** - Fuzzy search blocks UI
9. **No Prefetching** - Common searches not pre-cached
10. **No Result Streaming** - Could show partial results

---

## Optimization Strategy (Prioritized by Impact)

### 🔥 PHASE 1: Immediate Wins (Implement Now)
**Target**: 60% faster, <1s average search time

#### 1.1 Progressive Result Loading
**Impact**: ⭐⭐⭐⭐⭐ (Perceived speed: instant results)
**Complexity**: Low
```typescript
// Show results as they arrive, don't wait for all sources
const results = []
Promise.allSettled([usda, off, cnf]).forEach(result => {
  if (result.status === 'fulfilled') {
    results.push(...result.value)
    updateUI(results) // Stream to UI immediately
  }
})
```

#### 1.2 Search Result Caching (LRU Cache)
**Impact**: ⭐⭐⭐⭐⭐ (80% cache hit = instant results)
**Complexity**: Low
```typescript
// 5-minute cache with 100 entries max
const searchCache = new Map<string, {results: Food[], timestamp: number}>()
const CACHE_TTL = 5 * 60 * 1000
const CACHE_MAX_SIZE = 100
```

#### 1.3 Request Cancellation (AbortController)
**Impact**: ⭐⭐⭐⭐ (Prevents wasted API calls)
**Complexity**: Low
```typescript
let currentSearch: AbortController | null = null
// Cancel previous search before starting new one
currentSearch?.abort()
currentSearch = new AbortController()
fetch(url, { signal: currentSearch.signal })
```

#### 1.4 CNF Pre-initialization
**Impact**: ⭐⭐⭐⭐ (Eliminates 1-2s cold start)
**Complexity**: Low
```typescript
// Load CNF on component mount, not on first search
useEffect(() => {
  CNFService.initialize() // Background load
}, [])
```

#### 1.5 Optimized Deduplication
**Impact**: ⭐⭐⭐ (10-50ms saved per search)
**Complexity**: Low
```typescript
// Use Set/Map instead of nested loops
const seen = new Set<string>()
foods.filter(f => {
  const key = `${f.name.toLowerCase()}:${f.brand || ''}`
  if (seen.has(key)) return false
  seen.add(key)
  return true
})
```

#### 1.6 Skeleton Loading States
**Impact**: ⭐⭐⭐⭐ (Better perceived performance)
**Complexity**: Low
- Show skeleton cards immediately when search starts
- Replace with real data as it arrives

---

### 🚀 PHASE 2: Advanced Optimizations (Next Sprint)
**Target**: 80% faster, <500ms average

#### 2.1 IndexedDB for CNF Data
**Impact**: ⭐⭐⭐⭐ (Parse CSV once, instant subsequent loads)
**Complexity**: Medium
```typescript
// Parse CSV → Store in IndexedDB → Fast queries
await db.foods.bulkPut(parsedFoods)
const results = await db.foods.where('name').startsWithIgnoreCase(query).toArray()
```

#### 2.2 Web Worker for Heavy Processing
**Impact**: ⭐⭐⭐ (Non-blocking fuzzy search)
**Complexity**: Medium
```typescript
// Move Fuse.js processing to worker thread
const searchWorker = new Worker('search-worker.js')
searchWorker.postMessage({ query, foods })
```

#### 2.3 Search Suggestions & Prefetching
**Impact**: ⭐⭐⭐⭐ (Instant results for popular searches)
**Complexity**: Medium
```typescript
// Prefetch top 20 searches on page load
const popularSearches = ['chicken', 'rice', 'egg', 'milk', ...]
popularSearches.forEach(q => prefetchSearch(q))
```

#### 2.4 Virtual Scrolling for Results
**Impact**: ⭐⭐ (Faster rendering with 100+ results)
**Complexity**: Medium
```typescript
// Only render visible items
<VirtualList items={results} itemHeight={80} />
```

#### 2.5 Debounce Optimization
**Impact**: ⭐⭐ (Balance speed vs API calls)
**Complexity**: Low
```typescript
// Shorter debounce with cache, longer without
const debounceTime = isCached(query) ? 150 : 400
```

---

### 🎯 PHASE 3: Infrastructure (Future)
**Target**: 90% faster, <300ms average

#### 3.1 Edge Function API Aggregator
**Impact**: ⭐⭐⭐⭐⭐ (Single fast request vs 3 slow ones)
**Complexity**: High
```typescript
// Vercel Edge Function aggregates USDA + OFF + CNF
export default async function(req) {
  const { query } = req
  const results = await Promise.all([usda(query), off(query), cnf(query)])
  return new Response(JSON.stringify(dedupe(results)))
}
```

#### 3.2 Full-Text Search Index
**Impact**: ⭐⭐⭐⭐ (Client-side search, no API calls)
**Complexity**: High
```typescript
// Build MiniSearch index of all foods
import MiniSearch from 'minisearch'
const miniSearch = new MiniSearch({ fields: ['name', 'brand'] })
miniSearch.addAll(allFoods)
```

#### 3.3 Service Worker Caching
**Impact**: ⭐⭐⭐ (Offline support + instant cache hits)
**Complexity**: Medium
```typescript
// Cache API responses in service worker
self.addEventListener('fetch', event => {
  if (isAPIRequest(event.request)) {
    event.respondWith(cacheFirst(event.request))
  }
})
```

#### 3.4 Predictive Search
**Impact**: ⭐⭐⭐ (Search before user finishes typing)
**Complexity**: Medium
```typescript
// After "chic", predict "chicken" and prefetch
const suggestions = getSuggestions(partialQuery)
suggestions.forEach(s => prefetch(s))
```

---

## Implementation Priority (This Sprint)

### Must Have (Implement Now)
- [x] Progressive result loading
- [x] Search result caching (LRU)
- [x] Request cancellation (AbortController)
- [x] CNF pre-initialization
- [x] Optimized deduplication
- [x] Skeleton loading UI

### Should Have (Next)
- [ ] IndexedDB for CNF
- [ ] Web Worker for search
- [ ] Search prefetching

### Nice to Have (Future)
- [ ] Edge function aggregator
- [ ] Full-text search index
- [ ] Service Worker caching

---

## Expected Performance Improvements

| Metric | Before | After Phase 1 | After Phase 2 | After Phase 3 |
|--------|--------|---------------|---------------|---------------|
| **First Search** | 2-3s | 800ms | 500ms | 300ms |
| **Cached Search** | 2-3s | 50ms | 50ms | 20ms |
| **Perceived Speed** | 2-3s | Instant* | Instant* | Instant* |
| **API Load** | 100% | 40% | 20% | 10% |

*Instant = Progressive loading shows first results in <100ms

---

## Technical Details

### Cache Strategy
- **LRU Cache**: 100 entries, 5-minute TTL
- **Cache Key**: `${query.toLowerCase().trim()}:${brandFilter}`
- **Invalidation**: Time-based (5min) + manual clear

### Progressive Loading Order
1. **Cached results** (0ms) - Show immediately
2. **Local foods** (10ms) - Fuzzy search client-side
3. **CNF results** (50ms) - Local database
4. **USDA results** (500-1500ms) - Network API
5. **OFF results** (800-2000ms) - Network API

### Error Handling
- Individual source failures don't block other sources
- Show "X sources unavailable" notification
- Graceful degradation (local-only if all APIs fail)

### Monitoring
```typescript
performance.mark('search-start')
// ... search logic
performance.mark('search-end')
performance.measure('search-duration', 'search-start', 'search-end')
console.log('Search took:', performance.getEntriesByName('search-duration')[0].duration)
```

---

## Code Architecture Changes

### Before (Current)
```
Search Query → Debounce 400ms → Promise.all([USDA, OFF, CNF]) → Wait for ALL → Dedupe → Sort → Render
```

### After (Phase 1)
```
Search Query → Debounce 300ms → Check Cache → Return if cached
              ↓
           Not Cached → Start 3 parallel streams
              ↓
           Stream 1: Local foods → Render immediately (10ms)
           Stream 2: CNF → Render as arrives (50ms)
           Stream 3: USDA → Render as arrives (500ms)
           Stream 4: OFF → Render as arrives (800ms)
```

### After (Phase 3)
```
Search Query → Debounce 150ms → Check Cache → Return if cached
              ↓
           Not Cached → Edge Function → Aggregated Response (300ms)
              ↓
           Web Worker → Fuzzy Search → Render
```
