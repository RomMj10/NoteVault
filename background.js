
function isValidPage(url) {
  return url && url.startsWith("http");
}

function normalizeUrl(rawUrl) {
  try {
    const u = new URL(rawUrl);
    u.hash = "";
    u.search = "";
    return u.toString();
  } catch {
    return rawUrl;
  }
}

// Check for notes attached to current page and update badge
async function checkPageNotes() {
  try {
    const tabs = await browser.tabs.query({ active: true, currentWindow: true });
    if (!tabs || !tabs[0]) return;
    
    const currentUrl = normalizeUrl(tabs[0].url);
    
    const data = await browser.storage.local.get("nvNotes_cache");
    const notes = data.nvNotes_cache || [];
    
    const pageNotes = notes.filter(n => n.pageUrl && normalizeUrl(n.pageUrl) === currentUrl);
    const action = browser.action || browser.browserAction;

    if (isValidPage(currentUrl)) {
      if (pageNotes.length > 0) {
        action.setBadgeText({ text: pageNotes.length.toString() });
        action.setBadgeBackgroundColor({ color: "#f1be71" });
        
      } else {
        action.setBadgeText({ text: ""});
        
      }
      
    }
    
  } catch(e) {
    console.warn("Badge check failed:", e);
  }
}


browser.tabs.onActivated.addListener(checkPageNotes);
browser.tabs.onUpdated.addListener(checkPageNotes);
