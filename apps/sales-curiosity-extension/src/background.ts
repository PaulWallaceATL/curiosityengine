chrome.runtime.onInstalled.addListener(() => {
  console.log("Sales Curiosity Extension installed");
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === "PING_API") {
    const headers: Record<string, string> = { 
      "Content-Type": "application/json" 
    };
    
    // Add auth token if provided
    if (message.authToken) {
      headers["Authorization"] = `Bearer ${message.authToken}`;
    }
    
    fetch(message.url, {
      method: message.method || "GET",
      headers,
      body: message.body ? JSON.stringify(message.body) : undefined,
    })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        sendResponse({ ok: res.ok, status: res.status, data });
      })
      .catch((err) => {
        sendResponse({ ok: false, error: String(err) });
      });
    return true;
  }
});


