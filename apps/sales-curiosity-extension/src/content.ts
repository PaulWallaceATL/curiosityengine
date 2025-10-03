console.debug("Sales Curiosity content script loaded");

// Example: highlight all links on the page on demand
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === "HIGHLIGHT_LINKS") {
    document.querySelectorAll("a").forEach((a) => {
      (a as HTMLElement).style.outline = "2px solid #22c55e";
    });
  }
});


