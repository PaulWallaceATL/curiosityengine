import { useEffect, useState } from "react";
import React from "react";
import { createRoot } from "react-dom/client";

function Popup() {
  const [apiBase, setApiBase] = useState<string>(
    (typeof localStorage !== "undefined" && localStorage.getItem("apiBase")) ||
      "http://localhost:3000"
  );
  const [response, setResponse] = useState<string>("");

  useEffect(() => {
    try {
      localStorage.setItem("apiBase", apiBase);
    } catch {}
  }, [apiBase]);

  async function ping() {
    const url = `${apiBase}/api/health`;
    const res = await chrome.runtime.sendMessage({
      type: "PING_API",
      url,
      method: "GET",
    });
    setResponse(JSON.stringify(res, null, 2));
  }

  async function echo() {
    const url = `${apiBase}/api/echo?message=hello-from-extension`;
    const res = await chrome.runtime.sendMessage({
      type: "PING_API",
      url,
      method: "GET",
    });
    setResponse(JSON.stringify(res, null, 2));
  }

  async function highlightLinks() {
    try {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      const tab = tabs[0];
      if (tab && tab.id) {
        await chrome.tabs.sendMessage(tab.id, { type: "HIGHLIGHT_LINKS" });
      }
    } catch (e) {
      setResponse(String(e));
    }
  }

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", padding: 12, minWidth: 320 }}>
      <h1 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Sales Curiosity</h1>
      <label style={{ display: "block", fontSize: 12, marginBottom: 4 }}>API Base URL</label>
      <input
        value={apiBase}
        onChange={(e) => setApiBase(e.target.value)}
        style={{ width: "100%", padding: 6, border: "1px solid #ddd", borderRadius: 6 }}
      />
      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
        <button onClick={ping} style={{ padding: "6px 10px" }}>Ping</button>
        <button onClick={echo} style={{ padding: "6px 10px" }}>Echo</button>
        <button onClick={highlightLinks} style={{ padding: "6px 10px" }}>
          Highlight links
        </button>
      </div>
      <pre style={{ marginTop: 8, fontSize: 12, whiteSpace: "pre-wrap" }}>{response}</pre>
    </div>
  );
}

const root = createRoot(document.getElementById("root")!);
root.render(
  <React.StrictMode>
    <Popup />
  </React.StrictMode>
);


