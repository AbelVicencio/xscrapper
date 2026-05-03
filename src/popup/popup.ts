// ─────────────────────────────────────────────────────
// popup.ts — Lógica Resiliente
// ─────────────────────────────────────────────────────

function showToast(m: string) {
  const t = document.getElementById("toast");
  if (t) { t.textContent = m; t.classList.add("show"); setTimeout(() => t.classList.remove("show"), 2000); }
}

function formatDate(iso: string | null): string {
  if (!iso) return "Nunca";
  const d = new Date(iso);
  return `${d.getDate()} ${["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"][d.getMonth()]}, ${d.getHours()}:${String(d.getMinutes()).padStart(2,'0')}`;
}

function animateCount(el: HTMLElement, start: number, end: number) {
  if (start === end) return;
  const duration = 400;
  const startTime = performance.now();
  const step = (now: number) => {
    const progress = Math.min((now - startTime) / duration, 1);
    el.textContent = String(Math.floor(progress * (end - start) + start));
    if (progress < 1) requestAnimationFrame(step);
    else el.textContent = String(end);
  };
  requestAnimationFrame(step);
}

let lastCount = 0;
let isScrollingActive = false;

async function loadStats() {
  const statusText = document.getElementById("activeStatusText");
  const dot = document.querySelector(".status-dot");
  const chkActive = document.getElementById("chkActive") as HTMLInputElement;
  const btnAuto = document.getElementById("btnAutoscroll");
  const totalEl = document.getElementById("totalPosts");
  const exportEl = document.getElementById("lastExport");
  const footerStatusText = document.getElementById("statusText");

  let currentCount = 0;
  // Mantener el estado visual actual si hay fallos
  let isActive = chkActive ? chkActive.checked : false; 

  // 1. Obtener stats globales de respaldo
  try {
    const globalResp = await chrome.runtime.sendMessage({ type: "GET_STATS" });
    if (globalResp?.payload) {
      currentCount = globalResp.payload.totalPosts;
      if (exportEl) exportEl.textContent = formatDate(globalResp.payload.lastExport);
    }
  } catch (e) {
    // Silencioso, el SW podría estar inactivo temporalmente
  }

  // 2. Intentar datos en vivo desde la pestaña de X
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.url?.includes("x.com")) {
      try {
        const live = await chrome.tabs.sendMessage(tab.id!, { type: "GET_LIVE_STATS" });
        if (live) {
          // Usamos el número más alto disponible
          currentCount = Math.max(currentCount, live.count);
          isScrollingActive = !!live.isAutoscrolling;
          isActive = !!live.isActive;
          
          if (statusText) {
            statusText.textContent = isScrollingActive ? "Autoscroll..." : (isActive ? "Scraper activo" : "Pausado ☕");
          }
        }
      } catch (e) {
        // Error de conexión con la pestaña (el content script no está cargado)
        if (statusText) statusText.textContent = "Refresca la pestaña (F5)";
        isActive = false;
        isScrollingActive = false;
      }
    } else {
      if (statusText) statusText.textContent = "Abre x.com";
      isActive = false;
      isScrollingActive = false;
    }
  } catch (e) {
    console.error("Error consultando pestañas:", e);
  }

  // 3. Actualizar la UI siempre (sin importar si hubo errores arriba)
  if (chkActive) chkActive.checked = isActive;
  if (dot) isActive ? dot.classList.remove("off") : dot.classList.add("off");
  if (footerStatusText) footerStatusText.textContent = isActive ? "Observando cambios..." : "Deshabilitado...";
  
  if (btnAuto) {
    btnAuto.textContent = isScrollingActive ? "🛑 Detener autoscroll" : "🚀 Autoscroll";
    btnAuto.style.borderColor = isScrollingActive ? "#f4212e" : "#1d9bf0";
    btnAuto.style.color = isScrollingActive ? "#f4212e" : "#1d9bf0";
  }

  if (totalEl) {
    if (currentCount > lastCount) {
      totalEl.classList.add("pop-animation");
      setTimeout(() => totalEl.classList.remove("pop-animation"), 500);
      animateCount(totalEl, lastCount, currentCount);
    } else {
      totalEl.textContent = String(currentCount);
    }
    lastCount = currentCount;
  }
}

document.getElementById("chkActive")?.addEventListener("change", async (e: any) => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab?.id) chrome.tabs.sendMessage(tab.id, { type: "SET_SCRAPER_STATE", payload: { active: e.target.checked } });
});

// Botón: Cargar JSON (Importar)
const fileInput = document.getElementById("fileInput") as HTMLInputElement;
document.getElementById("btnLoad")?.addEventListener("click", () => fileInput?.click());

fileInput?.addEventListener("change", async (e: any) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async (event) => {
    try {
      const json = JSON.parse(event.target?.result as string);
      
      let postsToImport = [];
      let advSearchToImport = null;

      if (Array.isArray(json)) {
        postsToImport = json;
      } else if (json && Array.isArray(json.posts)) {
        postsToImport = json.posts;
        if (json.advanced_search) {
          advSearchToImport = json.advanced_search;
        }
      } else {
        throw new Error("Formato inválido");
      }

      if (advSearchToImport) {
        await chrome.storage.local.set({ advanced_search: advSearchToImport });
        applySearchFormData(advSearchToImport);
        updatePreview();
      }

      const isReplace = window.confirm("¿Deseas REEMPLAZAR todos los posts existentes con los de este archivo?\n\n• [Aceptar]: Reemplazar por completo.\n• [Cancelar]: Conservar los actuales y agregar los nuevos.");

      const response = await chrome.runtime.sendMessage({ 
        type: "IMPORT_DATA", 
        payload: { 
          posts: postsToImport,
          replace: isReplace
        } 
      });

      if (response?.success) {
        showToast(`📥 ${response.count} posts cargados`);
        loadStats();
        // Notificar a la pestaña para refrescar caché
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab?.id) chrome.tabs.sendMessage(tab.id, { type: "RELOAD_CACHE" }).catch(() => {});
      }
    } catch (err) {
      showToast("❌ Archivo JSON inválido");
      console.error(err);
    }
    fileInput.value = ""; // Reset para permitir cargar el mismo archivo
  };
  reader.readAsText(file);
});

document.getElementById("btnAutoscroll")?.addEventListener("click", async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab?.id) chrome.tabs.sendMessage(tab.id, { type: isScrollingActive ? "STOP_AUTOSCROLL" : "START_AUTOSCROLL" });
});

document.getElementById("btnScan")?.addEventListener("click", async () => {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.id) {
      const r = await chrome.tabs.sendMessage(tab.id, { type: "SCAN_VISIBLE" });
      if (r?.success) {
        showToast(`🔎 Escaneo total: ${r.count} posts`);
        loadStats();
      }
    }
  } catch (err) {
    showToast("⚠️ Error al escanear");
    console.error("Scan error:", err);
  }
});

// Helper para forzar guardado desde memoria antes de exportar
async function forcePersistBeforeExport() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.id) {
      await chrome.tabs.sendMessage(tab.id, { type: "FORCE_PERSIST" });
    }
  } catch (e) {
    // Si la pestaña falla, no hacemos nada crítico, solo advertimos en consola
    console.warn("No se pudo forzar persistencia (¿pestaña inactiva?)", e);
  }
}

document.getElementById("btnExport")?.addEventListener("click", async () => {
  await forcePersistBeforeExport();
  const r = await chrome.storage.local.get(["scraped_posts", "advanced_search"]);
  const posts = Object.values(r["scraped_posts"] || {}) as any[];
  if (posts.length === 0) return showToast("⚠️ Sin datos");
  
  // Ordenar por vistas (descendente)
  posts.sort((a, b) => (b.views || 0) - (a.views || 0));
  
  const exportData = {
    posts,
    advanced_search: r["advanced_search"] || getSearchFormData()
  };

  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  chrome.downloads.download({ url, filename: `x-export-${Date.now()}.json`, saveAs: true }, () => {
    chrome.storage.local.set({ last_export: new Date().toISOString() });
  });
});

document.getElementById("btnExportCSV")?.addEventListener("click", async () => {
  await forcePersistBeforeExport();
  const res = await chrome.storage.local.get("scraped_posts");
  const posts = Object.values(res["scraped_posts"] || {}) as any[];
  if (posts.length === 0) return showToast("⚠️ Sin datos");

  // Ordenar por vistas (descendente)
  posts.sort((a, b) => (b.views || 0) - (a.views || 0));

  // 1. Columnas base
  const headers = ["id", "author", "displayName", "date", "text", "url", "isQuote", "quotedPostId", "likes", "views", "reposts", "replies", "bookmarks", "lang", "appearanceCount", "isDetailView"];
  
  // 2. Calcular máximo de archivos multimedia para las columnas dinámicas
  let maxImages = 0;
  let maxVideos = 0;
  let maxLinks = 0;
  posts.forEach(p => {
    const pImages = p.imageUrls || p.mediaUrls; // soportar legacy
    if (pImages && pImages.length > maxImages) maxImages = pImages.length;
    if (p.videoUrls && p.videoUrls.length > maxVideos) maxVideos = p.videoUrls.length;
    if (p.linkUrls && p.linkUrls.length > maxLinks) maxLinks = p.linkUrls.length;
  });

  // Añadir encabezados de media y video
  for (let i = 1; i <= maxImages; i++) headers.push(`imageUrl${i}`);
  for (let i = 1; i <= maxVideos; i++) headers.push(`mediaVideo${i}`);
  for (let i = 1; i <= maxLinks; i++) headers.push(`link${i}`);

  const rows = [headers.join(",")];

  // 3. Generar filas
  posts.forEach(p => {
    const r = headers.map(h => {
      // Manejo de ID (Excel Fix)
      if (h === "id") return `="${p[h] ?? ""}"`;
      
      // Manejo de URLs multimedia (imágenes)
      if (h.startsWith("imageUrl")) {
        const index = parseInt(h.replace("imageUrl", "")) - 1;
        const pImages = p.imageUrls || p.mediaUrls;
        return `"${(pImages && pImages[index]) || ""}"`;
      }

      // Manejo de URLs de video
      if (h.startsWith("mediaVideo")) {
        const index = parseInt(h.replace("mediaVideo", "")) - 1;
        return `"${(p.videoUrls && p.videoUrls[index]) || ""}"`;
      }

      // Manejo de enlaces externos
      if (h.startsWith("link")) {
        const index = parseInt(h.replace("link", "")) - 1;
        return `"${(p.linkUrls && p.linkUrls[index]) || ""}"`;
      }

      // Manejo de otros campos
      let v = p[h] ?? "";
      if (typeof v === "string") return `"${v.replace(/\n/g, " ").replace(/"/g, '""')}"`;
      return v;
    });
    rows.push(r.join(","));
  });

  const blob = new Blob(["\uFEFF" + rows.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  chrome.downloads.download({ url, filename: `x-export-${Date.now()}.csv`, saveAs: true }, () => {
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    showToast("📊 CSV con Media generado");
  });
});

document.getElementById("btnClear")?.addEventListener("click", async () => {
  await chrome.runtime.sendMessage({ type: "CLEAR_DATA" });
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab?.id) await chrome.tabs.sendMessage(tab.id, { type: "CLEAR_MEMORY" }).catch(() => {});
  showToast("🗑️ Borrado");
});

setInterval(loadStats, 500);
loadStats();

// ═══════════════════════════════════════════════════════
// ADVANCED SEARCH DIALOG LOGIC
// ═══════════════════════════════════════════════════════

const dialogOverlay = document.getElementById("dialogOverlay");
const btnAdvSearch = document.getElementById("btnAdvSearch");
const btnCloseDialog = document.getElementById("btnCloseDialog");
const btnClearSearch = document.getElementById("btnClearSearch");
const btnSearchGo = document.getElementById("btnSearchGo") as HTMLButtonElement;
const urlPreview = document.getElementById("urlPreview");
const queryPreview = document.getElementById("queryPreview");
const btnCopyQuery = document.getElementById("btnCopyQuery");
const btnCopyUrl = document.getElementById("btnCopyUrl");

// Open/Close Dialog
btnAdvSearch?.addEventListener("click", () => {
  dialogOverlay?.classList.add("open");
  loadSearchForm();
});

btnCloseDialog?.addEventListener("click", () => {
  dialogOverlay?.classList.remove("open");
});

btnClearSearch?.addEventListener("click", () => {
  const emptyData = {
    sAllWords: "", sExactPhrase: "", sAnyWords: "", sNoneWords: "", sHashtags: "", sLang: "",
    sFromAccount: "", sToAccount: "", sMention: "",
    sMinReplies: "", sMinFaves: "", sMinRetweets: "",
    sSinceDate: "", sSinceTime: "", sUntilDate: "", sUntilTime: "",
    sFilterImages: false, sFilterVideos: false, sFilterLinks: false
  };
  applySearchFormData(emptyData);
  saveSearchForm();
  updatePreview();
  showToast("🗑️ Formulario limpio");
});

// Close on overlay click (outside dialog body)
dialogOverlay?.addEventListener("click", (e) => {
  if (e.target === dialogOverlay) dialogOverlay.classList.remove("open");
});

/**
 * Formatea una fecha y hora al formato que X entiende.
 * Si solo hay fecha, retorna YYYY-MM-DD.
 * Si hay fecha y hora, la convierte a UTC: YYYY-MM-DD_HH:MM:SS_UTC
 */
function formatXDate(dateVal: string, timeVal?: string): string {
  if (!dateVal) return "";
  
  if (!timeVal) return dateVal;

  const d = new Date(`${dateVal}T${timeVal}`);
  if (isNaN(d.getTime())) return dateVal;
  
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(d.getUTCDate()).padStart(2, '0');
  const hh = String(d.getUTCHours()).padStart(2, '0');
  const min = String(d.getUTCMinutes()).padStart(2, '0');
  
  return `${yyyy}-${mm}-${dd}_${hh}:${min}:00_UTC`;
}

/**
 * Builds the raw query string from all form fields,
 * following Twitter/X advanced search operator syntax.
 * Order: text terms first, then metadata filters.
 */
function buildSearchQuery(): string {
  const parts: string[] = [];

  // 1. Words section
  const allWords = (document.getElementById("sAllWords") as HTMLInputElement)?.value.trim();
  if (allWords) parts.push(allWords);

  const exactPhrase = (document.getElementById("sExactPhrase") as HTMLInputElement)?.value.trim();
  if (exactPhrase) parts.push(`"${exactPhrase}"`);

  const anyWords = (document.getElementById("sAnyWords") as HTMLInputElement)?.value.trim();
  if (anyWords) {
    const orParts = anyWords.split(/\s+/).join(" OR ");
    parts.push(orParts);
  }

  const noneWords = (document.getElementById("sNoneWords") as HTMLInputElement)?.value.trim();
  if (noneWords) {
    noneWords.split(/\s+/).forEach(w => parts.push(`-${w}`));
  }

  const hashtags = (document.getElementById("sHashtags") as HTMLInputElement)?.value.trim();
  if (hashtags) {
    hashtags.split(/\s+/).forEach(h => parts.push(`#${h}`));
  }

  const lang = (document.getElementById("sLang") as HTMLSelectElement)?.value;
  if (lang) parts.push(`lang:${lang}`);

  // 2. People section
  const fromAcc = (document.getElementById("sFromAccount") as HTMLInputElement)?.value.trim();
  if (fromAcc) parts.push(`from:${fromAcc}`);

  const toAcc = (document.getElementById("sToAccount") as HTMLInputElement)?.value.trim();
  if (toAcc) parts.push(`to:${toAcc}`);

  const mention = (document.getElementById("sMention") as HTMLInputElement)?.value.trim();
  if (mention) parts.push(`@${mention}`);

  // 3. Engagement section
  const minReplies = (document.getElementById("sMinReplies") as HTMLInputElement)?.value;
  if (minReplies && parseInt(minReplies) > 0) parts.push(`min_replies:${minReplies}`);

  const minFaves = (document.getElementById("sMinFaves") as HTMLInputElement)?.value;
  if (minFaves && parseInt(minFaves) > 0) parts.push(`min_faves:${minFaves}`);

  const minRetweets = (document.getElementById("sMinRetweets") as HTMLInputElement)?.value;
  if (minRetweets && parseInt(minRetweets) > 0) parts.push(`min_retweets:${minRetweets}`);

  // 4. Dates section
  const sinceDate = (document.getElementById("sSinceDate") as HTMLInputElement)?.value;
  const sinceTime = (document.getElementById("sSinceTime") as HTMLInputElement)?.value;
  if (sinceDate) parts.push(`since:${formatXDate(sinceDate, sinceTime)}`);

  const untilDate = (document.getElementById("sUntilDate") as HTMLInputElement)?.value;
  const untilTime = (document.getElementById("sUntilTime") as HTMLInputElement)?.value;
  if (untilDate) parts.push(`until:${formatXDate(untilDate, untilTime)}`);

  // 5. Media filters
  if ((document.getElementById("sFilterImages") as HTMLInputElement)?.checked) parts.push("filter:images");
  if ((document.getElementById("sFilterVideos") as HTMLInputElement)?.checked) parts.push("filter:videos");
  if ((document.getElementById("sFilterLinks") as HTMLInputElement)?.checked) parts.push("filter:links");

  return parts.join(" ");
}

/**
 * Builds the full encoded X.com search URL.
 */
function buildSearchUrl(): string {
  const query = buildSearchQuery();
  if (!query) return "";
  return `https://x.com/search?q=${encodeURIComponent(query)}&src=typed_query`;
}

/**
 * Updates the URL preview and the search button state in real-time.
 */
function updatePreview(): void {
  const query = buildSearchQuery();
  const url = buildSearchUrl();
  
  if (queryPreview) {
    if (query) {
      queryPreview.textContent = query;
      queryPreview.classList.add("has-query");
    } else {
      queryPreview.textContent = "Escribe términos...";
      queryPreview.classList.remove("has-query");
    }
  }

  if (urlPreview) {
    if (url) {
      urlPreview.textContent = url;
      urlPreview.classList.add("has-query");
    } else {
      urlPreview.textContent = "Escribe términos para ver la URL...";
      urlPreview.classList.remove("has-query");
    }
  }
  
  if (btnSearchGo) {
    btnSearchGo.disabled = !url;
  }
}

// Clipboard copying logic
async function copyToClipboard(text: string | null | undefined, type: string) {
  if (!text) {
    showToast(`⚠️ Nada que copiar en ${type}`);
    return;
  }
  try {
    await navigator.clipboard.writeText(text);
    showToast(`✅ ${type} copiada al portapapeles`);
  } catch (err) {
    showToast(`❌ Error al copiar ${type}`);
    console.error(`Failed to copy ${type}:`, err);
  }
}

btnCopyQuery?.addEventListener("click", () => {
  copyToClipboard(buildSearchQuery(), "Búsqueda");
});

btnCopyUrl?.addEventListener("click", () => {
  copyToClipboard(buildSearchUrl(), "URL");
});

function getSearchFormData() {
  return {
    sAllWords: (document.getElementById("sAllWords") as HTMLInputElement)?.value,
    sExactPhrase: (document.getElementById("sExactPhrase") as HTMLInputElement)?.value,
    sAnyWords: (document.getElementById("sAnyWords") as HTMLInputElement)?.value,
    sNoneWords: (document.getElementById("sNoneWords") as HTMLInputElement)?.value,
    sHashtags: (document.getElementById("sHashtags") as HTMLInputElement)?.value,
    sLang: (document.getElementById("sLang") as HTMLSelectElement)?.value,
    sFromAccount: (document.getElementById("sFromAccount") as HTMLInputElement)?.value,
    sToAccount: (document.getElementById("sToAccount") as HTMLInputElement)?.value,
    sMention: (document.getElementById("sMention") as HTMLInputElement)?.value,
    sMinReplies: (document.getElementById("sMinReplies") as HTMLInputElement)?.value,
    sMinFaves: (document.getElementById("sMinFaves") as HTMLInputElement)?.value,
    sMinRetweets: (document.getElementById("sMinRetweets") as HTMLInputElement)?.value,
    sSinceDate: (document.getElementById("sSinceDate") as HTMLInputElement)?.value,
    sSinceTime: (document.getElementById("sSinceTime") as HTMLInputElement)?.value,
    sUntilDate: (document.getElementById("sUntilDate") as HTMLInputElement)?.value,
    sUntilTime: (document.getElementById("sUntilTime") as HTMLInputElement)?.value,
    sFilterImages: (document.getElementById("sFilterImages") as HTMLInputElement)?.checked,
    sFilterVideos: (document.getElementById("sFilterVideos") as HTMLInputElement)?.checked,
    sFilterLinks: (document.getElementById("sFilterLinks") as HTMLInputElement)?.checked,
  };
}

async function saveSearchForm() {
  const data = getSearchFormData();
  await chrome.storage.local.set({ advanced_search: data });
}

async function loadSearchForm() {
  const r = await chrome.storage.local.get("advanced_search");
  if (r.advanced_search) {
    applySearchFormData(r.advanced_search);
    updatePreview();
  }
}

function applySearchFormData(data: any) {
  if (!data) return;
  const setVal = (id: string, val: any) => {
    const el = document.getElementById(id);
    if (el) {
      if (el instanceof HTMLInputElement && el.type === "checkbox") {
        el.checked = !!val;
      } else {
        (el as HTMLInputElement | HTMLSelectElement).value = val || "";
      }
    }
  };

  setVal("sAllWords", data.sAllWords);
  setVal("sExactPhrase", data.sExactPhrase);
  setVal("sAnyWords", data.sAnyWords);
  setVal("sNoneWords", data.sNoneWords);
  setVal("sHashtags", data.sHashtags);
  setVal("sLang", data.sLang);
  setVal("sFromAccount", data.sFromAccount);
  setVal("sToAccount", data.sToAccount);
  setVal("sMention", data.sMention);
  setVal("sMinReplies", data.sMinReplies);
  setVal("sMinFaves", data.sMinFaves);
  setVal("sMinRetweets", data.sMinRetweets);

  // Compatibilidad con datos antiguos guardados como datetime-local
  if (data.sSince && !data.sSinceDate) {
    if (data.sSince.includes("T")) {
      const [d, t] = data.sSince.split("T");
      data.sSinceDate = d; data.sSinceTime = t;
    } else { data.sSinceDate = data.sSince; }
  }
  if (data.sUntil && !data.sUntilDate) {
    if (data.sUntil.includes("T")) {
      const [d, t] = data.sUntil.split("T");
      data.sUntilDate = d; data.sUntilTime = t;
    } else { data.sUntilDate = data.sUntil; }
  }

  setVal("sSinceDate", data.sSinceDate);
  setVal("sSinceTime", data.sSinceTime);
  setVal("sUntilDate", data.sUntilDate);
  setVal("sUntilTime", data.sUntilTime);

  setVal("sFilterImages", data.sFilterImages);
  setVal("sFilterVideos", data.sFilterVideos);
  setVal("sFilterLinks", data.sFilterLinks);
}

// Listen for changes on ALL form inputs inside the dialog
const searchFormInputs = document.querySelectorAll("#searchForm input, #searchForm select");
searchFormInputs.forEach(input => {
  input.addEventListener("input", () => {
    updatePreview();
    saveSearchForm();
  });
  input.addEventListener("change", () => {
    updatePreview();
    saveSearchForm();
  });
});

// Run search: navigate the active tab to the constructed URL
btnSearchGo?.addEventListener("click", async () => {
  const url = buildSearchUrl();
  if (!url) return;

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.id) {
      await chrome.tabs.update(tab.id, { url });
      showToast("🔬 Búsqueda lanzada");
      // Close popup after navigating (gives it a moment to update)
      setTimeout(() => window.close(), 300);
    }
  } catch (err) {
    // If we can't update the tab, open in a new one
    chrome.tabs.create({ url });
    setTimeout(() => window.close(), 300);
  }
});
