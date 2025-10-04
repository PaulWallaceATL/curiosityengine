import { useEffect, useState } from "react";
import React from "react";
import { createRoot } from "react-dom/client";

function Popup() {
  const [apiBase, setApiBase] = useState<string>(
    (typeof localStorage !== "undefined" && localStorage.getItem("apiBase")) ||
      "http://localhost:3000"
  );
  const [currentUrl, setCurrentUrl] = useState<string>("");
  const [isLinkedIn, setIsLinkedIn] = useState<boolean>(false);
  const [response, setResponse] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    try {
      localStorage.setItem("apiBase", apiBase);
    } catch {}
  }, [apiBase]);

  // Get current tab URL on mount
  useEffect(() => {
    async function getCurrentTab() {
      try {
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        const tab = tabs[0];
        if (tab?.url) {
          setCurrentUrl(tab.url);
          setIsLinkedIn(tab.url.includes("linkedin.com"));
        }
      } catch (e) {
        console.error("Error getting current tab:", e);
      }
    }
    getCurrentTab();
  }, []);

  async function analyzeLinkedInPage() {
    if (!currentUrl) {
      setResponse("No URL detected");
      return;
    }

    setLoading(true);
    setResponse("Extracting profile data from page...");

    try {
      // First, extract the profile data from the page using content script
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      const tab = tabs[0];
      
      if (!tab || !tab.id) {
        throw new Error("No active tab found");
      }

      setResponse("Scraping LinkedIn profile...");

      // Extract profile data from the page
      let extractResponse;
      try {
        extractResponse = await chrome.tabs.sendMessage(tab.id, { 
          type: "EXTRACT_LINKEDIN_PROFILE" 
        });
      } catch (err) {
        // Content script might not be loaded, try to reload the page
        throw new Error(
          "Could not connect to the page. Please refresh the LinkedIn page and try again.\n\n" +
          "Tip: After installing or updating the extension, you need to refresh any open LinkedIn tabs."
        );
      }

      if (!extractResponse || !extractResponse.success) {
        throw new Error(
          extractResponse?.error || 
          "Failed to extract profile data. Please make sure you're on a LinkedIn profile page and refresh the page."
        );
      }

      // Check if we got any usable data
      const hasUsableData = extractResponse.data?.name || 
                           extractResponse.data?.headline || 
                           extractResponse.data?.fullPageText;
      
      if (!hasUsableData) {
        throw new Error(
          "Could not extract any profile information from the page. " +
          "Please scroll down on the LinkedIn profile to load more content, then try again."
        );
      }

      setResponse("Sending to AI for analysis...");

      // Send the extracted data to your API for AI analysis
      const res = await chrome.runtime.sendMessage({
        type: "PING_API",
        url: `${apiBase}/api/prospects`,
        method: "POST",
        body: {
          profileData: extractResponse.data,
          linkedinUrl: currentUrl,
        },
      });

      if (res.ok && res.data?.analysis) {
        setResponse(res.data.analysis);
      } else if (res.error) {
        throw new Error(`API Error: ${res.error}`);
      } else {
        setResponse(JSON.stringify(res, null, 2));
      }
    } catch (e) {
      setResponse(`❌ Error: ${String(e)}\n\nTroubleshooting:\n1. Refresh this LinkedIn page\n2. Reload the extension at chrome://extensions/\n3. Make sure your backend is running at ${apiBase}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", padding: 16, minWidth: 360 }}>
      <h1 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>Sales Curiosity</h1>
      
      {isLinkedIn ? (
        <>
          <div style={{ 
            background: "#f3f4f6", 
            padding: 10, 
            borderRadius: 8, 
            marginBottom: 12,
            fontSize: 12,
            wordBreak: "break-all"
          }}>
            <strong>LinkedIn Profile:</strong>
            <div style={{ marginTop: 4, color: "#4b5563" }}>{currentUrl}</div>
          </div>

          <button 
            onClick={analyzeLinkedInPage}
            disabled={loading}
            style={{ 
              width: "100%",
              padding: "12px 16px",
              background: loading ? "#9ca3af" : "#0066cc",
              color: "white",
              border: "none",
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
              transition: "background 0.2s"
            }}
            onMouseOver={(e) => {
              if (!loading) e.currentTarget.style.background = "#0052a3";
            }}
            onMouseOut={(e) => {
              if (!loading) e.currentTarget.style.background = "#0066cc";
            }}
          >
            {loading ? "Analyzing..." : "Analyze this LinkedIn page"}
          </button>
        </>
      ) : (
        <div style={{
          padding: 16,
          background: "#fef3c7",
          borderRadius: 8,
          fontSize: 13,
          color: "#92400e"
        }}>
          <strong>⚠️ Not a LinkedIn page</strong>
          <p style={{ marginTop: 8, marginBottom: 0 }}>
            Please navigate to a LinkedIn profile page to use this extension.
          </p>
        </div>
      )}

      {response && (
        <div style={{
          marginTop: 12,
          padding: 14,
          background: "#ffffff",
          borderRadius: 8,
          border: "1px solid #e5e7eb",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
        }}>
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 10
          }}>
            <strong style={{ fontSize: 13, color: "#374151", fontWeight: 600 }}>
              AI Analysis
            </strong>
            <button
              onClick={() => setResponse("")}
              style={{
                background: "none",
                border: "none",
                color: "#6b7280",
                cursor: "pointer",
                fontSize: 18,
                padding: 0,
                lineHeight: 1
              }}
              title="Clear"
            >
              ×
            </button>
          </div>
          <div style={{ 
            fontSize: 12, 
            lineHeight: "1.6",
            color: "#1f2937",
            maxHeight: 400,
            overflow: "auto",
            whiteSpace: "pre-wrap",
            wordBreak: "break-word"
          }}>
            {response}
          </div>
        </div>
      )}

      <details style={{ marginTop: 16, fontSize: 12 }}>
        <summary style={{ cursor: "pointer", color: "#6b7280" }}>Settings</summary>
        <div style={{ marginTop: 8 }}>
          <label style={{ display: "block", fontSize: 11, marginBottom: 4, color: "#374151" }}>
            API Base URL
          </label>
          <input
            value={apiBase}
            onChange={(e) => setApiBase(e.target.value)}
            style={{ 
              width: "100%", 
              padding: 6, 
              border: "1px solid #d1d5db", 
              borderRadius: 6,
              fontSize: 12
            }}
          />
        </div>
      </details>
    </div>
  );
}

const root = createRoot(document.getElementById("root")!);
root.render(
  <React.StrictMode>
    <Popup />
  </React.StrictMode>
);


