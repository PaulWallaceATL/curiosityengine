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
  const [profileData, setProfileData] = useState<any>(null);
  
  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [showLogin, setShowLogin] = useState<boolean>(true); // true = login, false = signup
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [fullName, setFullName] = useState<string>("");
  const [authLoading, setAuthLoading] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string>("");
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    try {
      localStorage.setItem("apiBase", apiBase);
    } catch {}
  }, [apiBase]);

  // Check if user is authenticated on mount
  useEffect(() => {
    async function checkAuth() {
      try {
        const result = await chrome.storage.local.get(['authToken', 'user']);
        if (result.authToken && result.user) {
          setIsAuthenticated(true);
          setUser(result.user);
        }
      } catch (e) {
        console.error("Error checking auth:", e);
      }
    }
    checkAuth();
  }, []);

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

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError("");

    try {
    const res = await chrome.runtime.sendMessage({
      type: "PING_API",
        url: `${apiBase}/api/auth/login`,
        method: "POST",
        body: { email, password },
      });

      if (res.ok && res.data?.user && res.data?.session) {
        await chrome.storage.local.set({
          authToken: res.data.session.access_token,
          user: res.data.user,
        });
        setIsAuthenticated(true);
        setUser(res.data.user);
        setEmail("");
        setPassword("");
      } else {
        setAuthError(res.data?.error || "Login failed");
      }
    } catch (err) {
      setAuthError("Connection error. Check your backend is running.");
    } finally {
      setAuthLoading(false);
    }
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError("");

    try {
    const res = await chrome.runtime.sendMessage({
      type: "PING_API",
        url: `${apiBase}/api/auth/signup`,
        method: "POST",
        body: { email, password, fullName },
      });

      if (res.ok && res.data?.user) {
        setAuthError("");
        setShowLogin(true);
        setEmail("");
        setPassword("");
        setFullName("");
        // Show success message
        alert("Account created! Please login.");
      } else {
        setAuthError(res.data?.error || "Signup failed");
      }
    } catch (err) {
      setAuthError("Connection error. Check your backend is running.");
    } finally {
      setAuthLoading(false);
    }
  }

  async function handleLogout() {
    await chrome.storage.local.remove(['authToken', 'user']);
    setIsAuthenticated(false);
    setUser(null);
    setResponse("");
  }

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

      // Get auth token
      const { authToken } = await chrome.storage.local.get(['authToken']);

      // Send the extracted data to your API for AI analysis
      const res = await chrome.runtime.sendMessage({
        type: "PING_API",
        url: `${apiBase}/api/prospects`,
        method: "POST",
        body: {
          profileData: extractResponse.data,
          linkedinUrl: currentUrl,
        },
        authToken,
      });

      if (res.ok && res.data?.analysis) {
        setResponse(res.data.analysis);
        setProfileData(res.data.profileData || extractResponse.data);
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

  function exportAsText() {
    if (!response) return;
    const blob = new Blob([response], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${profileData?.name || 'linkedin'}-analysis.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function exportAsHTML() {
    if (!response) return;
    
    const styledHTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${profileData?.name || 'LinkedIn Profile'} - Sales Analysis</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
      line-height: 1.7;
      color: #1f2937;
      max-width: 800px;
      margin: 40px auto;
      padding: 40px;
      background: #f9fafb;
    }
    .header {
      background: linear-gradient(135deg, #0ea5e9 0%, #3b82f6 100%);
      color: white;
      padding: 32px;
      border-radius: 12px;
      margin-bottom: 32px;
      box-shadow: 0 10px 30px rgba(14, 165, 233, 0.3);
    }
    .header h1 {
      font-size: 28px;
      font-weight: 700;
      margin-bottom: 8px;
    }
    .header .subtitle {
      font-size: 14px;
      opacity: 0.9;
    }
    .profile-info {
      background: white;
      padding: 24px;
      border-radius: 12px;
      margin-bottom: 24px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
      border-left: 4px solid #0ea5e9;
    }
    .profile-info h2 {
      font-size: 20px;
      color: #0ea5e9;
      margin-bottom: 12px;
    }
    .profile-info p {
      margin: 6px 0;
      color: #4b5563;
    }
    .content {
      background: white;
      padding: 32px;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    }
    h3 {
      font-size: 18px;
      font-weight: 700;
      color: #0ea5e9;
      margin-top: 28px;
      margin-bottom: 14px;
      padding-bottom: 8px;
      border-bottom: 2px solid #e5e7eb;
    }
    h3:first-child { margin-top: 0; }
    ul {
      list-style: none;
      margin: 12px 0;
    }
    li {
      margin: 10px 0;
      padding-left: 24px;
      position: relative;
      color: #374151;
    }
    li:before {
      content: "•";
      position: absolute;
      left: 0;
      color: #0ea5e9;
      font-weight: bold;
      font-size: 20px;
    }
    p {
      margin: 10px 0;
      color: #4b5563;
    }
    hr {
      border: none;
      border-top: 1px solid #e5e7eb;
      margin: 24px 0;
    }
    .footer {
      text-align: center;
      margin-top: 32px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      color: #9ca3af;
      font-size: 12px;
    }
    @media print {
      body { background: white; margin: 0; }
      .header { box-shadow: none; }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>🤖 Sales Intelligence Report</h1>
    <div class="subtitle">AI-Powered LinkedIn Analysis by Sales Curiosity</div>
  </div>
  
  <div class="profile-info">
    <h2>Profile Information</h2>
    <p><strong>Name:</strong> ${profileData?.name || 'N/A'}</p>
    <p><strong>Headline:</strong> ${profileData?.headline || 'N/A'}</p>
    <p><strong>Location:</strong> ${profileData?.location || 'N/A'}</p>
    <p><strong>LinkedIn:</strong> <a href="${profileData?.url || currentUrl}">${profileData?.url || currentUrl}</a></p>
    <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
  </div>

  <div class="content">
${response.split('\n').map(line => {
  if (line.startsWith('**') && line.endsWith('**')) {
    return `    <h3>${line.replace(/\*\*/g, '')}</h3>`;
  }
  if (line.startsWith('• ') || line.startsWith('- ')) {
    return `    <li>${line.substring(2)}</li>`;
  }
  if (line.trim() === '---') {
    return `    <hr>`;
  }
  if (line.trim()) {
    return `    <p>${line}</p>`;
  }
  return '';
}).join('\n')}
  </div>

  <div class="footer">
    Generated by Sales Curiosity Extension • ${new Date().toLocaleDateString()}
  </div>
</body>
</html>`;

    const blob = new Blob([styledHTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${profileData?.name || 'linkedin'}-analysis.html`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // Show auth screen if not authenticated
  if (!isAuthenticated) {
    return (
      <div style={{
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', system-ui, sans-serif",
        width: 380,
        background: "linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)",
        padding: 0,
        margin: 0
      }}>
        {/* Auth Header */}
        <div style={{
          background: "white",
          padding: "24px",
          borderBottom: "1px solid #e5e7eb"
        }}>
          <div style={{ textAlign: "center" }}>
            <div style={{
              width: 56,
              height: 56,
              borderRadius: 14,
              background: "linear-gradient(135deg, #0ea5e9 0%, #3b82f6 100%)",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 28,
              marginBottom: 12,
              boxShadow: "0 6px 16px rgba(14, 165, 233, 0.3)"
            }}>
              🤖
            </div>
            <h1 style={{
              fontSize: 22,
              fontWeight: 700,
              margin: "0 0 6px 0",
              color: "#0f172a"
            }}>
              Sales Curiosity
            </h1>
            <p style={{
              fontSize: 13,
              color: "#64748b",
              margin: 0
            }}>
              AI-Powered LinkedIn Intelligence
            </p>
          </div>
        </div>

        {/* Auth Form */}
        <div style={{ padding: "24px" }}>
          {authError && (
            <div style={{
              padding: "12px",
              background: "#fee2e2",
              color: "#991b1b",
              borderRadius: 8,
              marginBottom: 16,
              fontSize: 12,
              border: "1px solid #fecaca"
            }}>
              {authError}
            </div>
          )}

          <form onSubmit={showLogin ? handleLogin : handleSignup}>
            {!showLogin && (
              <div style={{ marginBottom: 14 }}>
                <label style={{
                  display: "block",
                  fontSize: 12,
                  fontWeight: 600,
                  marginBottom: 6,
                  color: "#334155"
                }}>
                  Full Name
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  placeholder="John Doe"
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    border: "1px solid #cbd5e1",
                    borderRadius: 8,
                    fontSize: 13,
                    outline: "none",
                    transition: "all 0.2s ease"
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "#0ea5e9";
                    e.currentTarget.style.boxShadow = "0 0 0 3px rgba(14, 165, 233, 0.1)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "#cbd5e1";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                />
              </div>
            )}

            <div style={{ marginBottom: 14 }}>
              <label style={{
                display: "block",
                fontSize: 12,
                fontWeight: 600,
                marginBottom: 6,
                color: "#334155"
              }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  border: "1px solid #cbd5e1",
                  borderRadius: 8,
                  fontSize: 13,
                  outline: "none",
                  transition: "all 0.2s ease"
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "#0ea5e9";
                  e.currentTarget.style.boxShadow = "0 0 0 3px rgba(14, 165, 233, 0.1)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "#cbd5e1";
                  e.currentTarget.style.boxShadow = "none";
                }}
              />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{
                display: "block",
                fontSize: 12,
                fontWeight: 600,
                marginBottom: 6,
                color: "#334155"
              }}>
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                minLength={6}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  border: "1px solid #cbd5e1",
                  borderRadius: 8,
                  fontSize: 13,
                  outline: "none",
                  transition: "all 0.2s ease"
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "#0ea5e9";
                  e.currentTarget.style.boxShadow = "0 0 0 3px rgba(14, 165, 233, 0.1)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "#cbd5e1";
                  e.currentTarget.style.boxShadow = "none";
                }}
              />
              {!showLogin && (
                <p style={{ fontSize: 11, color: "#64748b", margin: "4px 0 0 0" }}>
                  At least 6 characters
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={authLoading}
              style={{
                width: "100%",
                padding: "12px",
                background: authLoading 
                  ? "#94a3b8" 
                  : "linear-gradient(135deg, #0ea5e9 0%, #3b82f6 100%)",
                color: "white",
                border: "none",
                borderRadius: 10,
                fontSize: 14,
                fontWeight: 700,
                cursor: authLoading ? "not-allowed" : "pointer",
                boxShadow: authLoading ? "none" : "0 4px 14px rgba(14, 165, 233, 0.35)",
                transition: "all 0.2s ease"
              }}
            >
              {authLoading ? "Please wait..." : (showLogin ? "Sign In" : "Create Account")}
            </button>
          </form>

          <div style={{
            marginTop: 16,
            textAlign: "center",
            fontSize: 12,
            color: "#64748b"
          }}>
            {showLogin ? "Don't have an account?" : "Already have an account?"}{' '}
            <button
              onClick={() => {
                setShowLogin(!showLogin);
                setAuthError("");
                setEmail("");
                setPassword("");
                setFullName("");
              }}
              style={{
                background: "none",
                border: "none",
                color: "#0ea5e9",
                fontWeight: 600,
                cursor: "pointer",
                textDecoration: "none",
                fontSize: 12,
                padding: 0
              }}
            >
              {showLogin ? "Sign up" : "Sign in"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', 'SF Pro Display', system-ui, sans-serif",
      width: 420,
      minHeight: 500,
      background: "linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)",
      padding: 0,
      margin: 0
    }}>
      {/* Header */}
      <div style={{
        background: "white",
        padding: "20px 24px",
        borderBottom: "1px solid #e5e7eb",
        boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: "linear-gradient(135deg, #0ea5e9 0%, #3b82f6 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 20,
              boxShadow: "0 4px 12px rgba(14, 165, 233, 0.3)"
            }}>
              🤖
            </div>
            <div>
              <h1 style={{
                fontSize: 20,
                fontWeight: 700,
                margin: 0,
                color: "#0f172a",
                letterSpacing: "-0.3px"
              }}>
                Sales Curiosity
              </h1>
              <p style={{
                fontSize: 10,
                color: "#64748b",
                margin: 0,
                fontWeight: 500
              }}>
                {user?.email || "Logged in"}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            style={{
              padding: "6px 12px",
              background: "#f1f5f9",
              border: "none",
              borderRadius: 6,
              fontSize: 11,
              fontWeight: 600,
              color: "#475569",
              cursor: "pointer",
              transition: "all 0.2s ease"
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = "#e2e8f0";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = "#f1f5f9";
            }}
          >
            Logout
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div style={{ padding: "24px" }}>
        {isLinkedIn ? (
          <>
            {/* URL Display Card */}
            <div style={{
              background: "white",
              padding: "16px",
              borderRadius: 12,
              marginBottom: 16,
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.06)",
              border: "1px solid #e5e7eb"
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
                  background: "#0077b5",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 11,
                  fontWeight: 700,
                  color: "white"
                }}>
                  in
                </div>
                <span style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: "#0f172a"
                }}>
                  LinkedIn Profile Detected
                </span>
              </div>
              <div style={{
                fontSize: 11,
                color: "#64748b",
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
                padding: "14px",
                background: loading 
                  ? "#94a3b8"
                  : "linear-gradient(135deg, #0ea5e9 0%, #3b82f6 100%)",
                color: "white",
                border: "none",
                borderRadius: 10,
                fontSize: 14,
                fontWeight: 700,
                cursor: loading ? "not-allowed" : "pointer",
                boxShadow: loading ? "none" : "0 4px 14px rgba(14, 165, 233, 0.35)",
                transition: "all 0.2s ease",
                letterSpacing: "0.2px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8
              }}
              onMouseOver={(e) => {
                if (!loading) {
                  e.currentTarget.style.transform = "translateY(-1px)";
                  e.currentTarget.style.boxShadow = "0 6px 20px rgba(14, 165, 233, 0.4)";
                }
              }}
              onMouseOut={(e) => {
                if (!loading) {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 4px 14px rgba(14, 165, 233, 0.35)";
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
            background: "white",
            padding: "20px",
            borderRadius: 12,
            border: "2px solid #fbbf24",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.06)"
          }}>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginBottom: 12
            }}>
              <div style={{ fontSize: 24 }}>⚠️</div>
              <strong style={{
                fontSize: 14,
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
            background: "white",
            borderRadius: 12,
            boxShadow: "0 4px 16px rgba(0, 0, 0, 0.08)",
            overflow: "hidden",
            border: "1px solid #e5e7eb",
            animation: "slideIn 0.3s ease"
          }}>
            {/* Response Header */}
            <div style={{
              background: "linear-gradient(135deg, #0ea5e9 0%, #3b82f6 100%)",
              padding: "12px 18px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}>
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: 8
              }}>
                <span style={{ fontSize: 16 }}>✨</span>
                <strong style={{
                  fontSize: 13,
                  color: "white",
                  fontWeight: 700,
                  letterSpacing: "0.2px"
                }}>
                  AI Analysis Results
                </strong>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <button
                  onClick={exportAsText}
                  style={{
                    background: "rgba(255, 255, 255, 0.2)",
                    border: "none",
                    color: "white",
                    cursor: "pointer",
                    fontSize: 11,
                    padding: "4px 10px",
                    borderRadius: 6,
                    transition: "all 0.2s ease",
                    fontWeight: 600
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = "rgba(255, 255, 255, 0.3)";
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = "rgba(255, 255, 255, 0.2)";
                  }}
                  title="Export as TXT"
                >
                  📄 TXT
                </button>
                <button
                  onClick={exportAsHTML}
                  style={{
                    background: "rgba(255, 255, 255, 0.2)",
                    border: "none",
                    color: "white",
                    cursor: "pointer",
                    fontSize: 11,
                    padding: "4px 10px",
                    borderRadius: 6,
                    transition: "all 0.2s ease",
                    fontWeight: 600
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = "rgba(255, 255, 255, 0.3)";
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = "rgba(255, 255, 255, 0.2)";
                  }}
                  title="Export as HTML"
                >
                  📑 HTML
                </button>
                <button
                  onClick={() => setResponse("")}
                  style={{
                    background: "rgba(255, 255, 255, 0.2)",
                    border: "none",
                    color: "white",
                    cursor: "pointer",
                    fontSize: 16,
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
            </div>

            {/* Response Content with Enhanced Typography */}
            <div style={{
              padding: "20px",
              fontSize: 13,
              lineHeight: "1.7",
              color: "#0f172a",
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
                      color: "#0ea5e9",
                      marginTop: i === 0 ? 0 : 18,
                      marginBottom: 10,
                      letterSpacing: "0.2px"
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
                      marginBottom: 8,
                      paddingLeft: 4
                    }}>
                      <span style={{
                        color: "#0ea5e9",
                        fontWeight: 700,
                        fontSize: 14,
                        lineHeight: 1.5
                      }}>
                        •
                      </span>
                      <span style={{
                        flex: 1,
                        color: "#334155",
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
                      marginBottom: 10,
                      paddingLeft: 8
                    }}>
                      <span style={{
                        color: "#334155",
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
                      margin: "14px 0"
                    }} />
                  );
                }
                // Regular text
                if (line.trim()) {
                  return (
                    <p key={i} style={{
                      margin: "0 0 8px 0",
                      color: "#475569",
                      lineHeight: 1.6
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


