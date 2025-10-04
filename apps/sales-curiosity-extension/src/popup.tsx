import { useEffect, useState } from "react";
import React from "react";
import { createRoot } from "react-dom/client";

function Popup() {
  const [apiBase, setApiBase] = useState<string>(
    (typeof localStorage !== "undefined" && localStorage.getItem("apiBase")) ||
      "https://curiosityengine-sales-curiosity-web.vercel.app"
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
    <div style={{
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', 'SF Pro Display', system-ui, sans-serif",
      width: 420,
      minHeight: 500,
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      padding: 0,
      margin: 0
    }}>
      {/* Header */}
      <div style={{
        background: "rgba(255, 255, 255, 0.98)",
        padding: "20px 24px",
        borderBottom: "1px solid rgba(102, 126, 234, 0.1)",
        backdropFilter: "blur(10px)"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
          <div style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 20
          }}>
            ✨
          </div>
          <div>
            <h1 style={{
              fontSize: 22,
              fontWeight: 700,
              margin: 0,
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              letterSpacing: "-0.5px"
            }}>
              Sales Curiosity
            </h1>
            <p style={{
              fontSize: 12,
              color: "#6b7280",
              margin: 0,
              fontWeight: 500
            }}>
              AI-Powered LinkedIn Intelligence
            </p>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div style={{ padding: "24px" }}>
        {isLinkedIn ? (
          <>
            {/* URL Display Card */}
            <div style={{
              background: "rgba(255, 255, 255, 0.95)",
              padding: "16px",
              borderRadius: 12,
              marginBottom: 16,
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
              border: "1px solid rgba(255, 255, 255, 0.5)"
            }}>
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 8
              }}>
                <div style={{
                  width: 24,
                  height: 24,
                  borderRadius: 6,
                  background: "linear-gradient(135deg, #0077b5 0%, #00a0dc 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 12
                }}>
                  in
                </div>
                <span style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: "#1f2937"
                }}>
                  LinkedIn Profile Detected
                </span>
              </div>
              <div style={{
                fontSize: 11,
                color: "#6b7280",
                wordBreak: "break-all",
                lineHeight: 1.5,
                paddingLeft: 32
              }}>
                {currentUrl}
              </div>
            </div>

            {/* Analyze Button */}
            <button
              onClick={analyzeLinkedInPage}
              disabled={loading}
              style={{
                width: "100%",
                padding: "16px",
                background: loading 
                  ? "linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)"
                  : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                color: "white",
                border: "none",
                borderRadius: 12,
                fontSize: 15,
                fontWeight: 700,
                cursor: loading ? "not-allowed" : "pointer",
                boxShadow: loading ? "none" : "0 8px 16px rgba(102, 126, 234, 0.3)",
                transition: "all 0.3s ease",
                letterSpacing: "0.3px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8
              }}
              onMouseOver={(e) => {
                if (!loading) {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = "0 12px 24px rgba(102, 126, 234, 0.4)";
                }
              }}
              onMouseOut={(e) => {
                if (!loading) {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 8px 16px rgba(102, 126, 234, 0.3)";
                }
              }}
            >
              {loading ? (
                <>
                  <div style={{
                    width: 16,
                    height: 16,
                    border: "2px solid rgba(255,255,255,0.3)",
                    borderTop: "2px solid white",
                    borderRadius: "50%",
                    animation: "spin 0.8s linear infinite"
                  }} />
                  Analyzing Profile...
                </>
              ) : (
                <>
                  <span>🔍</span>
                  Analyze This Profile
                </>
              )}
            </button>
          </>
        ) : (
          <div style={{
            background: "rgba(254, 243, 199, 0.95)",
            padding: "20px",
            borderRadius: 12,
            border: "1px solid rgba(251, 191, 36, 0.3)",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)"
          }}>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginBottom: 12
            }}>
              <div style={{
                fontSize: 28,
                filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.1))"
              }}>
                ⚠️
              </div>
              <strong style={{
                fontSize: 15,
                color: "#92400e",
                fontWeight: 700
              }}>
                Not a LinkedIn Page
              </strong>
            </div>
            <p style={{
              margin: 0,
              fontSize: 13,
              color: "#78350f",
              lineHeight: 1.6
            }}>
              Please navigate to a LinkedIn profile page to analyze it with AI-powered insights.
            </p>
          </div>
        )}

        {/* Response Card */}
        {response && (
          <div style={{
            marginTop: 16,
            background: "rgba(255, 255, 255, 0.98)",
            borderRadius: 12,
            boxShadow: "0 8px 24px rgba(0, 0, 0, 0.12)",
            overflow: "hidden",
            border: "1px solid rgba(102, 126, 234, 0.2)",
            animation: "slideIn 0.3s ease"
          }}>
            {/* Response Header */}
            <div style={{
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              padding: "14px 18px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}>
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: 8
              }}>
                <span style={{ fontSize: 18 }}>🤖</span>
                <strong style={{
                  fontSize: 14,
                  color: "white",
                  fontWeight: 700,
                  letterSpacing: "0.3px"
                }}>
                  AI Analysis Results
                </strong>
              </div>
              <button
                onClick={() => setResponse("")}
                style={{
                  background: "rgba(255, 255, 255, 0.2)",
                  border: "none",
                  color: "white",
                  cursor: "pointer",
                  fontSize: 20,
                  padding: "4px 8px",
                  borderRadius: 6,
                  lineHeight: 1,
                  transition: "all 0.2s ease",
                  fontWeight: 700
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = "rgba(255, 255, 255, 0.3)";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = "rgba(255, 255, 255, 0.2)";
                }}
                title="Clear"
              >
                ×
              </button>
            </div>

            {/* Response Content with Enhanced Typography */}
            <div style={{
              padding: "20px",
              fontSize: 13,
              lineHeight: "1.8",
              color: "#1f2937",
              maxHeight: 450,
              overflow: "auto",
              fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', system-ui, sans-serif"
            }}>
              {response.split('\n').map((line, i) => {
                // Headers (bold text with **)
                if (line.startsWith('**') && line.endsWith('**')) {
                  return (
                    <h3 key={i} style={{
                      fontSize: 14,
                      fontWeight: 700,
                      color: "#667eea",
                      marginTop: i === 0 ? 0 : 20,
                      marginBottom: 12,
                      letterSpacing: "0.3px"
                    }}>
                      {line.replace(/\*\*/g, '')}
                    </h3>
                  );
                }
                // Bullet points
                if (line.startsWith('• ') || line.startsWith('- ')) {
                  return (
                    <div key={i} style={{
                      display: "flex",
                      gap: 10,
                      marginBottom: 10,
                      paddingLeft: 4
                    }}>
                      <span style={{
                        color: "#667eea",
                        fontWeight: 700,
                        fontSize: 16,
                        lineHeight: 1.4
                      }}>
                        •
                      </span>
                      <span style={{
                        flex: 1,
                        color: "#374151",
                        lineHeight: 1.6
                      }}>
                        {line.substring(2)}
                      </span>
                    </div>
                  );
                }
                // Numbered lists
                if (/^\d+\./.test(line)) {
                  return (
                    <div key={i} style={{
                      marginBottom: 12,
                      paddingLeft: 8
                    }}>
                      <span style={{
                        color: "#374151",
                        fontWeight: 600,
                        lineHeight: 1.6
                      }}>
                        {line}
                      </span>
                    </div>
                  );
                }
                // Divider (---)
                if (line.trim() === '---') {
                  return (
                    <hr key={i} style={{
                      border: "none",
                      borderTop: "1px solid #e5e7eb",
                      margin: "16px 0"
                    }} />
                  );
                }
                // Regular text
                if (line.trim()) {
                  return (
                    <p key={i} style={{
                      margin: "0 0 10px 0",
                      color: "#4b5563",
                      lineHeight: 1.7
                    }}>
                      {line}
                    </p>
                  );
                }
                return <br key={i} />;
              })}
            </div>
          </div>
        )}

        {/* Settings */}
        <details style={{
          marginTop: 16,
          background: "rgba(255, 255, 255, 0.9)",
          borderRadius: 10,
          padding: "12px 16px",
          border: "1px solid rgba(255, 255, 255, 0.5)"
        }}>
          <summary style={{
            cursor: "pointer",
            color: "#6b7280",
            fontSize: 12,
            fontWeight: 600,
            listStyle: "none",
            display: "flex",
            alignItems: "center",
            gap: 6
          }}>
            <span>⚙️</span> Advanced Settings
          </summary>
          <div style={{ marginTop: 12 }}>
            <label style={{
              display: "block",
              fontSize: 11,
              marginBottom: 6,
              color: "#374151",
              fontWeight: 600
            }}>
              API Base URL
            </label>
            <input
              value={apiBase}
              onChange={(e) => setApiBase(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 12px",
                border: "1px solid #d1d5db",
                borderRadius: 8,
                fontSize: 12,
                fontFamily: "monospace",
                outline: "none",
                transition: "all 0.2s ease"
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "#667eea";
                e.currentTarget.style.boxShadow = "0 0 0 3px rgba(102, 126, 234, 0.1)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "#d1d5db";
                e.currentTarget.style.boxShadow = "none";
              }}
            />
          </div>
        </details>
      </div>

      {/* Add keyframe animations */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}

const root = createRoot(document.getElementById("root")!);
root.render(
  <React.StrictMode>
    <Popup />
  </React.StrictMode>
);


