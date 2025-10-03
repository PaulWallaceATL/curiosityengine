chrome.runtime.onInstalled.addListener(() => {
  console.log("Sales Curiosity Extension installed");
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === "PING_API") {
    fetch(message.url, {
      method: message.method || "GET",
      headers: { "Content-Type": "application/json" },
      body: message.body ? JSON.stringify(message.body) : undefined,
    })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        sendResponse({ ok: true, status: res.status, data });
      })
      .catch((err) => {
        sendResponse({ ok: false, error: String(err) });
      });
    return true;
  }
});


