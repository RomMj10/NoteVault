//Background script, required for extension to register properly in Firefox/Zen
browser.browserAction.onClicked.addListener(() => {
  //fallback
});

// Check for notes attached to current page and update badge
async function checkPageNotes() {
  try {
    const tabs = await browser.tabs.query({ active: true, currentWindow: true });
    if (!tabs || !tabs[0]) return;
    
    const currentUrl = tabs[0].url;
    
    // Get notes from storage
    const data = await browser.storage.local.get("nvNotes_cache");
    const notes = data.nvNotes_cache || [];
    
    // Filter notes attached to this page
    const pageNotes = notes.filter(n => n.pageUrl && currentUrl.includes(n.pageUrl));
    
    if (pageNotes.length > 0) {
      browser.browserAction.setBadgeText({ text: pageNotes.length.toString() });
      browser.browserAction.setBadgeBackgroundColor({ color: "#c9a84c" });
    } else {
      browser.browserAction.setBadgeText({ text: "" });
    }
  } catch(e) {
    console.warn("Badge check failed:", e);
  }
}

// Run on tab activation and update
browser.tabs.onActivated.addListener(checkPageNotes);
browser.tabs.onUpdated.addListener(checkPageNotes);
