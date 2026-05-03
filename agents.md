# 🤖 AI Agents Guide: X Content Scraper

This document provides context and guidelines for AI coding assistants (like Antigravity, Copilot, etc.) working on this repository.

## 🏗️ Architecture Overview

The extension follows a standard Manifest V3 architecture with a focus on passive data extraction.

1.  **Content Scripts (`src/content/`)**: 
    - Uses `MutationObserver` to watch for DOM changes in X.com.
    - Sends detected element batches to the background script.
    - Maintains a high-speed memory cache (`memoryStore`) of scraped items.
2.  **Background Script / Service Worker (`src/background/`)**: 
    - Acts as the central hub and manages downloads.
    - Merges external data imports into local storage securely.
3.  **Storage Engine (`src/storage/`)**: 
    - Wraps `chrome.storage.local`.
    - Implements a "double-buffer" system: memory cache for fast UI updates + debounced 20s disk persistence.
    - Utilizes a `FORCE_PERSIST` event handler to flush memory cache to disk immediately before exports.
4.  **Extractors (`src/extractors/`)**: 
    - **CRITICAL**: Contains the parsing algorithms.
    - Advanced React Fiber traversal is implemented here to scrape `__reactFiber$` and `__reactProps$` states for hidden data like MP4s.

## 🛠️ Key Modules & Responsibilities

- **`src/extractors/tweetExtractor.ts`**: Contains the logic to find tweet elements and map them to the `Tweet` interface.
- **`src/storage/StorageManager.ts`**: Handles CRUD operations and data merging logic.
- **`src/types.ts`**: The source of truth for data structures.

## 📋 Coding Guidelines for Agents

### 1. Handling X.com DOM Changes
X.com uses obfuscated/generated class names (e.g., `css-175oi2r`). 
- **Rule**: Prefer accessibility attributes (`aria-label`, `data-testid`) or stable hierarchical paths over raw class names when possible.
- **Check**: Before updating a selector, verify it against the latest X.com DOM structure.

### 2. Performance First
The `MutationObserver` triggers frequently.
- **Rule**: Keep the content script logic extremely lean. 
- **Pattern**: Use a debounce or throttling mechanism before processing batches of elements.

### 3. Data Integrity
- **Rule**: Never treat Tweet IDs as numbers. They exceed the MAX_SAFE_INTEGER in JavaScript. Always handle them as **strings**.
- **Rule**: When exporting to CSV, use the `="ID"` format to prevent Excel from corrupting the ID.

### 4. Communication Pattern
Use `chrome.runtime.sendMessage` with a clear `type` property.
```typescript
{ type: 'NEW_TWEETS_DETECTED', payload: [...] }
```

## 🔄 Common Tasks

### Adding a new field to scrape
1.  Update `PostData` interface in `src/types.ts`.
2.  Update the extraction logic in `src/extractors/tweetExtractor.ts`.
3.  Update the CSV export mapping in `src/popup/popup.ts` (dynamic column headers might be needed).
4.  Update the `store.ts` merging logic if the new field requires array deduplication (use `Set`).

### Fixing a broken selector
1.  Identify the broken field (e.g., "Views count").
2.  Locate the relevant selector in `src/extractors/tweetExtractor.ts`.
3.  Prefer `data-testid` attributes or React Fiber properties.

### React Fiber Extractions (Stealth Mode)
If a DOM attribute doesn't contain the data (e.g., videos use `blob:` urls), access the React Fiber state directly:
1. Search up the DOM tree for a container with `__reactFiber$` or `__reactProps$`.
2. Use deep-search recursion (with `WeakSet` to prevent circular loop crashes) on `memoizedProps` or `pendingProps`.
3. Bounding the depth (e.g., `depth > 15`) is critical because X.com's Fiber trees are massive.

## ⚠️ Known Gotchas
- **Lazy Loading**: X.com unmounts tweets from the DOM as you scroll. The scraper must capture them as they appear.
- **Storage Limits**: `chrome.storage.local` has limits (though high). Monitor the data size if the project involves massive scraping.

---

*This file should be updated whenever significant architectural changes are made.*
