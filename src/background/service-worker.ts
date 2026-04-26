// ─────────────────────────────────────────────────────
// service-worker.ts — Background service worker (Manifest V3)
// ─────────────────────────────────────────────────────
// Maneja la persistencia a disco (JSON download),
// el badge del ícono, y la comunicación con el popup.
// ─────────────────────────────────────────────────────

const STORAGE_KEY = "scraped_posts";

/**
 * Escuchar mensajes del content script y popup.
 */
chrome.runtime.onMessage.addListener((message: any, sender, sendResponse) => {
  switch (message.type) {
    case "POSTS_EXTRACTED": {
      const count = message.payload?.length ?? 0;
      console.log(`[SW] 📥 Recibidos ${count} posts del content script`);
      // Actualizar badge
      updateBadge();
      break;
    }

    case "UPDATE_BADGE": {
      const count = message.payload?.count ?? 0;
      setBadgeCount(count);
      break;
    }

    case "GET_STATS": {
      chrome.storage.local.get(STORAGE_KEY, (result) => {
        const data = result[STORAGE_KEY] || {};
        const totalPosts = Object.keys(data).length;
        chrome.storage.local.get("last_export", (exportResult) => {
          sendResponse({
            type: "STATS_RESPONSE",
            payload: {
              totalPosts,
              lastExport: exportResult["last_export"] || null,
            },
          });
        });
      });
      return true; // Mantener el canal abierto para sendResponse async
    }

    case "IMPORT_DATA": {
      const importedPosts = message.payload?.posts || [];
      chrome.storage.local.get(STORAGE_KEY, (result) => {
        const existingData = result[STORAGE_KEY] || {};
        let importedCount = 0;

        importedPosts.forEach((post: any) => {
          if (!post.id) return;
          
          if (!existingData[post.id]) {
            // Nuevo post
            existingData[post.id] = post;
            importedCount++;
          } else {
            // Fusionar (lógica simplificada de upsert para el SW)
            const existing = existingData[post.id];
            // Quedarse con el texto más largo
            if ((post.text?.length || 0) > (existing.text?.length || 0)) {
              existing.text = post.text;
            }
            // Max métricas (ahora aplanadas)
            existing.likes = Math.max(existing.likes || 0, post.likes || 0);
            existing.views = Math.max(existing.views || 0, post.views || 0);
            existing.reposts = Math.max(existing.reposts || 0, post.reposts || 0);
            existing.replies = Math.max(existing.replies || 0, post.replies || 0);
            existing.bookmarks = Math.max(existing.bookmarks || 0, post.bookmarks || 0);

            // Actualizar lastUpdated si el importado es más reciente
            if (new Date(post.lastUpdated) > new Date(existing.lastUpdated)) {
              existing.lastUpdated = post.lastUpdated;
            }
            importedCount++;
          }
        });

        chrome.storage.local.set({ [STORAGE_KEY]: existingData }, () => {
          updateBadge();
          sendResponse({ success: true, count: importedCount });
        });
      });
      return true;
    }

    case "CLEAR_DATA": {
      chrome.storage.local.remove([STORAGE_KEY, "last_export"], () => {
        setBadgeCount(0);
        sendResponse({ success: true });
      });
      return true;
    }
  }
});

/**
 * Actualiza el badge leyendo el storage.
 */
async function updateBadge(): Promise<void> {
  const result = await chrome.storage.local.get(STORAGE_KEY);
  const data = result[STORAGE_KEY] || {};
  const count = Object.keys(data).length;
  setBadgeCount(count);
}

/**
 * Establece el número en el badge del ícono de la extensión.
 */
function setBadgeCount(count: number): void {
  const text = count > 0 ? (count > 999 ? "999+" : String(count)) : "";
  chrome.action.setBadgeText({ text });
  chrome.action.setBadgeBackgroundColor({ color: "#1d9bf0" });
}

// Actualizar badge al iniciar
updateBadge();
console.log("[SW] 🟢 Service worker iniciado");
