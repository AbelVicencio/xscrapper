// ─────────────────────────────────────────────────────
// content/index.ts — Motor Corregido
// ─────────────────────────────────────────────────────
import { createTweetObserver } from "./observer";
import { loadFromStorage, persistToStorage, getMemorySize, clearAll } from "../storage/store";

const PERSIST_INTERVAL_MS = 20000;
const BADGE_INTERVAL_MS = 3000;

let autoscrollTimer: any = null;
let isAutoscrollRunning = false;

function isContextValid() { return !!chrome.runtime && !!chrome.runtime.id; }

async function main() {
  await loadFromStorage();

  const observer = createTweetObserver({
    onNewPosts: (posts) => {
      if (!isContextValid()) return;
      chrome.runtime.sendMessage({ type: "POSTS_EXTRACTED", payload: posts }).catch(() => {});
    }
  });

  observer.start();

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (!isContextValid()) return;

    if (message.type === "GET_LIVE_STATS") {
      sendResponse({ 
        count: getMemorySize(),
        isAutoscrolling: isAutoscrollRunning,
        isActive: observer.isActive ? observer.isActive() : true // Seguridad extra
      });
    } 
    else if (message.type === "SET_SCRAPER_STATE") {
      if (message.payload?.active) observer.start();
      else { 
        observer.stop(); 
        isAutoscrollRunning = false;
        if (autoscrollTimer) clearTimeout(autoscrollTimer);
      }
      sendResponse({ success: true });
    }
    else if (message.type === "START_AUTOSCROLL") {
      if (autoscrollTimer) clearTimeout(autoscrollTimer);
      isAutoscrollRunning = true;
      const run = () => {
        if (!isAutoscrollRunning) return;
        window.scrollBy({ top: window.innerHeight * (0.5 + Math.random() * 0.4), behavior: 'smooth' });
        autoscrollTimer = setTimeout(run, 1500 + Math.random() * 1000);
      };
      run();
      sendResponse({ success: true });
    }
    else if (message.type === "STOP_AUTOSCROLL") {
      isAutoscrollRunning = false;
      if (autoscrollTimer) clearTimeout(autoscrollTimer);
      sendResponse({ success: true });
    }
    else if (message.type === "SCAN_VISIBLE") {
      observer.scanVisible();
      sendResponse({ success: true, count: getMemorySize() });
    }
    else if (message.type === "CLEAR_MEMORY") {
      clearAll().then(() => sendResponse({ success: true }));
    }
    
    return true; 
  });

  setInterval(() => { if (isContextValid()) persistToStorage(); }, PERSIST_INTERVAL_MS);
  setInterval(() => {
    if (isContextValid()) {
      chrome.runtime.sendMessage({ type: "UPDATE_BADGE", payload: { count: getMemorySize() } }).catch(() => {});
    }
  }, BADGE_INTERVAL_MS);
}

main().catch(console.error);
