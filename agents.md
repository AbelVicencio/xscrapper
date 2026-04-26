# 🤖 AI Agents Guide: X Content Scraper

This document provides context and guidelines for AI coding assistants (like Antigravity, Copilot, etc.) working on this repository.

## 🏗️ Architecture Overview

The extension follows a standard Manifest V3 architecture with a focus on passive data extraction.

1.  **Content Scripts (`src/content/`)**: 
    - Uses `MutationObserver` to watch for DOM changes in X.com.
    - Sends detected element batches to the background script.
2.  **Background Script (`src/background/`)**: 
    - Acts as the central hub.
    - Manages the global state of the scraper.
    - Handles file downloads and message passing between components.
3.  **Storage Engine (`src/storage/`)**: 
    - Wraps `chrome.storage.local`.
    - Implements a "double-buffer" system: memory cache for fast UI updates + debounced disk persistence.
4.  **Extractors (`src/extractors/`)**: 
    - **CRITICAL**: This is the most volatile part of the code. It contains the CSS selectors for X.com.
    - All scraping logic must be encapsulated here.

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
1.  Update `Tweet` interface in `src/types.ts`.
2.  Update the extraction logic in `src/extractors/tweetExtractor.ts`.
3.  Update the CSV export mapping in `src/utils/csvConverter.ts` (if applicable).
4.  Update the `StorageManager` merging logic if the new field requires special handling.

### Fixing a broken selector
1.  Identify the broken field (e.g., "Views count").
2.  Locate the relevant selector in `src/extractors/`.
3.  Use `data-testid` attributes (like `tweetText`, `like`, `retweet`) as they are more stable than classes.

## ⚠️ Known Gotchas
- **Lazy Loading**: X.com unmounts tweets from the DOM as you scroll. The scraper must capture them as they appear.
- **Storage Limits**: `chrome.storage.local` has limits (though high). Monitor the data size if the project involves massive scraping.

---

*This file should be updated whenever significant architectural changes are made.*
