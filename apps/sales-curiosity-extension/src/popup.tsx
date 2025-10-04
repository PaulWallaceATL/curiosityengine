import { useEffect, useState } from "react";
import React from "react";
import { createRoot } from "react-dom/client";
import { jsPDF } from "jspdf";

type Page = "home" | "context" | "integrations";
type ActionType = "analyze" | "email";

interface UserContext {
  aboutMe: string;
  objectives: string;
}

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
  
  // Navigation state
  const [currentPage, setCurrentPage] = useState<Page>("home");
  const [actionType, setActionType] = useState<ActionType | null>(null);
  const [emailContext, setEmailContext] = useState<string>("");
  
  // User context state
  const [userContext, setUserContext] = useState<UserContext>({ aboutMe: "", objectives: "" });
  const [tempContext, setTempContext] = useState<UserContext>({ aboutMe: "", objectives: "" });
  const [saving, setSaving] = useState<boolean>(false);
  const [saveMessage, setSaveMessage] = useState<string>("");
  
  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [showLogin, setShowLogin] = useState<boolean>(true); // true = login, false = signup
  const [showPasswordReset, setShowPasswordReset] = useState<boolean>(false);
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [fullName, setFullName] = useState<string>("");
  const [authLoading, setAuthLoading] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string>("");
  const [authSuccess, setAuthSuccess] = useState<string>("");
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

  // Load user context from storage
  useEffect(() => {
    async function loadContext() {
      try {
        const result = await chrome.storage.local.get(['userContext']);
        if (result.userContext) {
          setUserContext(result.userContext);
          setTempContext(result.userContext);
        }
      } catch (e) {
        console.error("Error loading context:", e);
      }
    }
    if (isAuthenticated) {
      loadContext();
    }
  }, [isAuthenticated]);

  // Sync tempContext with userContext when it changes
  useEffect(() => {
    setTempContext(userContext);
  }, [userContext]);

  // Save user context to storage
  async function saveUserContext(context: UserContext) {
    try {
      await chrome.storage.local.set({ userContext: context });
      setUserContext(context);
    } catch (e) {
      console.error("Error saving context:", e);
    }
  }

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
        setAuthSuccess("Account created successfully! Please sign in.");
        setShowLogin(true);
        setEmail("");
        setPassword("");
        setFullName("");
        setTimeout(() => setAuthSuccess(""), 5000);
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

  async function handlePasswordReset(e: React.FormEvent) {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError("");
    setAuthSuccess("");

    try {
      const res = await chrome.runtime.sendMessage({
        type: "PING_API",
        url: `${apiBase}/api/auth/reset-password`,
        method: "POST",
        body: { email },
      });

      if (res.ok) {
        setAuthSuccess("Password reset email sent! Check your inbox.");
        setTimeout(() => {
          setShowPasswordReset(false);
          setShowLogin(true);
          setAuthSuccess("");
        }, 4000);
      } else {
        setAuthError(res.data?.error || "Failed to send reset email");
      }
    } catch (err) {
      setAuthError("Connection error. Please try again.");
    } finally {
      setAuthLoading(false);
    }
  }

  async function analyzeLinkedInPage(action: ActionType = "analyze") {
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

      setResponse(action === "email" ? "Drafting email with AI..." : "Sending to AI for analysis...");

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
          action: action,
          userContext: userContext,
          emailContext: action === "email" ? emailContext : undefined,
        },
        authToken,
      });

      if (res.ok && res.data?.analysis) {
        setResponse(res.data.analysis);
        setProfileData(res.data.profileData || extractResponse.data);
        setActionType(null);
        setEmailContext("");
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

  async function exportAsPDF() {
    if (!response) return;

    try {
      const doc = new jsPDF('p', 'pt', 'letter');
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 40;
      let yPos = 40;

      // Helper to add text with word wrap
      const addText = (text: string, fontSize: number, color: string, bold: boolean = false, indent: number = 0) => {
        doc.setFontSize(fontSize);
        doc.setTextColor(color);
        if (bold) doc.setFont('helvetica', 'bold');
        else doc.setFont('helvetica', 'normal');
        
        const lines = doc.splitTextToSize(text, pageWidth - margin * 2 - indent);
        lines.forEach((line: string) => {
          if (yPos > doc.internal.pageSize.getHeight() - 60) {
            doc.addPage();
            yPos = 40;
          }
          doc.text(line, margin + indent, yPos);
          yPos += fontSize * 1.4;
        });
      };

      // Header with blue background
      doc.setFillColor(14, 165, 233);
      doc.rect(0, 0, pageWidth, 100, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.text('Sales Intelligence Report', margin, 45);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.text('AI-Powered LinkedIn Analysis by Sales Curiosity', margin, 70);
      
      yPos = 130;

      // Profile Information Box
      doc.setDrawColor(14, 165, 233);
      doc.setLineWidth(3);
      doc.line(margin, yPos, margin, yPos + 100);
      doc.setFillColor(240, 249, 255);
      doc.rect(margin, yPos, pageWidth - margin * 2, 100, 'F');
      
      yPos += 20;
      addText('Profile Information', 14, '#0ea5e9', true);
      yPos += 10;
      addText(`Name: ${profileData?.name || 'N/A'}`, 10, '#4b5563');
      addText(`Headline: ${profileData?.headline || 'N/A'}`, 10, '#4b5563');
      addText(`Location: ${profileData?.location || 'N/A'}`, 10, '#4b5563');
      addText(`Generated: ${new Date().toLocaleString()}`, 10, '#64748b');
      
      yPos += 30;

      // Content
      response.split('\n').forEach((line) => {
        if (line.startsWith('**') && line.endsWith('**')) {
          yPos += 15;
          addText(line.replace(/\*\*/g, ''), 14, '#0ea5e9', true);
          yPos += 5;
        } else if (line.startsWith('• ') || line.startsWith('- ')) {
          addText('•  ' + line.substring(2), 10, '#334155', false, 10);
        } else if (line.trim() && line.trim() !== '---') {
          addText(line, 10, '#475569');
        } else if (line.trim() === '---') {
          yPos += 10;
        }
      });

      // Footer
      const footerY = doc.internal.pageSize.getHeight() - 30;
      doc.setFontSize(9);
      doc.setTextColor(156, 163, 175);
      doc.setFont('helvetica', 'normal');
      doc.text(
        `Generated by Sales Curiosity Extension • ${new Date().toLocaleDateString()}`,
        pageWidth / 2,
        footerY,
        { align: 'center' }
      );

      // Download
      doc.save(`${profileData?.name || 'linkedin'}-analysis.pdf`);
    } catch (error) {
      console.error('PDF generation error:', error);
      alert('Error generating PDF. Please try TXT export instead.');
    }
  }

  async function exportAsDOCX() {
    if (!response) return;

    try {
      // Get auth token
      const { authToken } = await chrome.storage.local.get(['authToken']);

      // Send to backend to generate DOCX
      const res = await chrome.runtime.sendMessage({
        type: "PING_API",
        url: `${apiBase}/api/export/docx`,
        method: "POST",
        body: {
          analysis: response,
          profileData,
          linkedinUrl: currentUrl,
        },
        authToken,
      });

      if (res.ok && res.data?.docxBase64) {
        // Convert base64 to blob and download
        const binaryString = atob(res.data.docxBase64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        const blob = new Blob([bytes], {
          type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${profileData?.name || 'linkedin'}-analysis.docx`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        throw new Error('Failed to generate DOCX');
      }
    } catch (error) {
      console.error('DOCX generation error:', error);
      alert('Error generating DOCX. Please try TXT or PDF export instead.');
    }
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
              {showPasswordReset ? 'Reset Your Password' : 'AI-Powered LinkedIn Intelligence'}
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

          {authSuccess && (
            <div style={{
              padding: "12px",
              background: "#d1fae5",
              color: "#065f46",
              borderRadius: 8,
              marginBottom: 16,
              fontSize: 12,
              border: "1px solid #6ee7b7"
            }}>
              ✓ {authSuccess}
            </div>
          )}

          {showPasswordReset ? (
            /* Password Reset Form */
            <form onSubmit={handlePasswordReset}>
              <p style={{
                fontSize: 13,
                color: "#475569",
                marginBottom: 16,
                lineHeight: 1.5
              }}>
                Enter your email address and we'll send you instructions to reset your password.
              </p>

              <div style={{ marginBottom: 20 }}>
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
                {authLoading ? "Sending..." : "Send Reset Link"}
              </button>

              <div style={{
                marginTop: 16,
                textAlign: "center",
                fontSize: 12,
                color: "#64748b"
              }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordReset(false);
                    setShowLogin(true);
                    setAuthError("");
                    setAuthSuccess("");
                    setEmail("");
                  }}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#0ea5e9",
                    fontWeight: 600,
                    cursor: "pointer",
                    fontSize: 12,
                    padding: 0
                  }}
                >
                  ← Back to Sign In
                </button>
              </div>
            </form>
          ) : (
            /* Login/Signup Form */
            <>
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

          {showLogin && (
            <div style={{
              marginTop: 12,
              textAlign: "center",
              fontSize: 12
            }}>
              <button
                type="button"
                onClick={() => {
                  setShowPasswordReset(true);
                  setShowLogin(false);
                  setAuthError("");
                  setAuthSuccess("");
                }}
                style={{
                  background: "none",
                  border: "none",
                  color: "#64748b",
                  cursor: "pointer",
                  fontSize: 12,
                  padding: 0,
                  textDecoration: "underline"
                }}
              >
                Forgot password?
              </button>
            </div>
          )}

          <div style={{
            marginTop: 16,
            textAlign: "center",
            fontSize: 12,
            color: "#64748b"
          }}>
            {showLogin ? "Don't have an account?" : "Already have an account?"}{' '}
            <button
              type="button"
              onClick={() => {
                setShowLogin(!showLogin);
                setShowPasswordReset(false);
                setAuthError("");
                setAuthSuccess("");
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
          </>
          )}
        </div>
      </div>
    );
  }

  // Home Page Component
  const renderHomePage = () => {
    if (!isLinkedIn) {
  return (
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
      );
    }

    return (
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

        {/* Action Selection */}
        {!actionType && !response && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <button
              onClick={() => setActionType("analyze")}
              disabled={loading}
              style={{
                width: "100%",
                padding: "16px",
                background: "linear-gradient(135deg, #0ea5e9 0%, #3b82f6 100%)",
                color: "white",
                border: "none",
                borderRadius: 10,
                fontSize: 14,
                fontWeight: 700,
                cursor: "pointer",
                boxShadow: "0 4px 14px rgba(14, 165, 233, 0.35)",
                transition: "all 0.2s ease",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 10
              }}
              onMouseOver={(e) => {
                  e.currentTarget.style.transform = "translateY(-1px)";
                  e.currentTarget.style.boxShadow = "0 6px 20px rgba(14, 165, 233, 0.4)";
              }}
              onMouseOut={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 4px 14px rgba(14, 165, 233, 0.35)";
              }}
            >
              <span style={{ fontSize: 20 }}>🔍</span>
              <span>Analyze Profile</span>
            </button>

            <button
              onClick={() => setActionType("email")}
              disabled={loading}
              style={{
                width: "100%",
                padding: "16px",
                background: "linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)",
                color: "white",
                border: "none",
                borderRadius: 10,
                fontSize: 14,
                fontWeight: 700,
                cursor: "pointer",
                boxShadow: "0 4px 14px rgba(139, 92, 246, 0.35)",
                transition: "all 0.2s ease",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 10
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = "translateY(-1px)";
                e.currentTarget.style.boxShadow = "0 6px 20px rgba(139, 92, 246, 0.4)";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 4px 14px rgba(139, 92, 246, 0.35)";
              }}
            >
              <span style={{ fontSize: 20 }}>✉️</span>
              <span>Draft Email</span>
            </button>
          </div>
        )}

        {/* Email Context Input */}
        {actionType === "email" && !response && (
          <div style={{
            background: "white",
            padding: "20px",
            borderRadius: 12,
            marginTop: 16,
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.06)",
            border: "1px solid #e5e7eb"
          }}>
            <label style={{
              display: "block",
              fontSize: 13,
              fontWeight: 600,
              color: "#0f172a",
              marginBottom: 8
            }}>
              Email Context (Optional)
            </label>
            <p style={{
              fontSize: 11,
              color: "#64748b",
              marginBottom: 12,
              lineHeight: 1.5
            }}>
              Add specific context about how you'd like to approach this email or anything specific you want to mention.
            </p>
            <textarea
              value={emailContext}
              onChange={(e) => setEmailContext(e.target.value)}
              placeholder="E.g., I want to highlight our new product features, focus on solving their pain points around healthcare documentation..."
              style={{
                width: "100%",
                minHeight: 100,
                padding: "12px",
                border: "1px solid #cbd5e1",
                borderRadius: 8,
                fontSize: 12,
                fontFamily: "inherit",
                resize: "vertical",
                outline: "none",
                boxSizing: "border-box"
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
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <button
                onClick={() => analyzeLinkedInPage("email")}
                disabled={loading}
                style={{
                  flex: 1,
                  padding: "12px",
                  background: loading 
                    ? "#94a3b8"
                    : "linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)",
                  color: "white",
                  border: "none",
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: loading ? "not-allowed" : "pointer",
                  boxShadow: loading ? "none" : "0 4px 14px rgba(139, 92, 246, 0.35)"
                }}
              >
                {loading ? "Drafting..." : "Generate Email"}
              </button>
              <button
                onClick={() => {
                  setActionType(null);
                  setEmailContext("");
                }}
                disabled={loading}
                style={{
                  padding: "12px 20px",
                  background: "#f1f5f9",
                  color: "#475569",
                  border: "none",
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer"
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Analyze Confirmation */}
        {actionType === "analyze" && !response && (
          <div style={{
            background: "white",
            padding: "20px",
            borderRadius: 12,
            marginTop: 16,
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.06)",
            border: "1px solid #e5e7eb"
          }}>
            <p style={{
              fontSize: 13,
              color: "#475569",
              marginBottom: 16,
              lineHeight: 1.6
            }}>
              Ready to analyze this LinkedIn profile with AI insights?
            </p>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={() => analyzeLinkedInPage("analyze")}
                disabled={loading}
                style={{
                  flex: 1,
                  padding: "12px",
                  background: loading 
                    ? "#94a3b8"
                    : "linear-gradient(135deg, #0ea5e9 0%, #3b82f6 100%)",
                  color: "white",
                  border: "none",
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: loading ? "not-allowed" : "pointer",
                  boxShadow: loading ? "none" : "0 4px 14px rgba(14, 165, 233, 0.35)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8
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
                    Analyzing...
                </>
              ) : (
                  "Start Analysis"
              )}
            </button>
              <button
                onClick={() => setActionType(null)}
                disabled={loading}
                style={{
                  padding: "12px 20px",
                  background: "#f1f5f9",
                  color: "#475569",
                  border: "none",
                  borderRadius: 8,
              fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer"
                }}
              >
                Cancel
              </button>
            </div>
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
                  AI Results
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
                  onClick={exportAsPDF}
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
                  title="Export as PDF"
                >
                  📑 PDF
                </button>
                <button
                  onClick={exportAsDOCX}
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
                  title="Export as DOCX"
                >
                  📝 DOCX
                </button>
                <button
                  onClick={() => {
                    setResponse("");
                    setActionType(null);
                  }}
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

            {/* Response Content */}
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
                if (line.trim() === '---') {
                  return (
                    <hr key={i} style={{
                      border: "none",
                      borderTop: "1px solid #e5e7eb",
                      margin: "14px 0"
                    }} />
                  );
                }
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
      </>
    );
  };

  // Context Page Component
  const renderContextPage = () => {
    const handleSave = async () => {
      setSaving(true);
      await saveUserContext(tempContext);
      setSaveMessage("✓ Context saved successfully!");
      setTimeout(() => setSaveMessage(""), 3000);
      setSaving(false);
    };

    return (
      <div style={{
        background: "white",
        padding: "24px",
        borderRadius: 12,
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.06)",
        border: "1px solid #e5e7eb"
      }}>
        <div style={{ marginBottom: 20 }}>
          <h2 style={{
            fontSize: 18,
            fontWeight: 700,
            color: "#0f172a",
            margin: "0 0 8px 0"
          }}>
            Your Context
          </h2>
          <p style={{
            fontSize: 12,
            color: "#64748b",
            margin: 0,
            lineHeight: 1.5
          }}>
            This information will be used to personalize AI-generated analyses and emails.
          </p>
      </div>

        {saveMessage && (
          <div style={{
            padding: "12px",
            background: "#d1fae5",
            color: "#065f46",
            borderRadius: 8,
            marginBottom: 16,
            fontSize: 12,
            border: "1px solid #6ee7b7"
          }}>
            {saveMessage}
          </div>
        )}

        <div style={{ marginBottom: 20 }}>
          <label style={{
            display: "block",
            fontSize: 13,
            fontWeight: 600,
            color: "#0f172a",
            marginBottom: 8
          }}>
            About Me
          </label>
          <p style={{
            fontSize: 11,
            color: "#64748b",
            marginBottom: 8,
            lineHeight: 1.5
          }}>
            Describe your role, company, and what you do.
          </p>
          <textarea
            value={tempContext.aboutMe}
            onChange={(e) => setTempContext({ ...tempContext, aboutMe: e.target.value })}
            placeholder="E.g., I'm a Sales Director at TechCorp, specializing in enterprise healthcare solutions..."
            style={{
              width: "100%",
              minHeight: 100,
              padding: "12px",
              border: "1px solid #cbd5e1",
              borderRadius: 8,
              fontSize: 12,
              fontFamily: "inherit",
              resize: "vertical",
              outline: "none",
              boxSizing: "border-box"
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
            fontSize: 13,
            fontWeight: 600,
            color: "#0f172a",
            marginBottom: 8
          }}>
            My Objectives
          </label>
          <p style={{
            fontSize: 11,
            color: "#64748b",
            marginBottom: 8,
            lineHeight: 1.5
          }}>
            What are your sales goals and what you're looking to achieve?
          </p>
          <textarea
            value={tempContext.objectives}
            onChange={(e) => setTempContext({ ...tempContext, objectives: e.target.value })}
            placeholder="E.g., Looking to connect with healthcare decision-makers, build relationships with CMOs and CTOs, increase product adoption..."
            style={{
              width: "100%",
              minHeight: 100,
              padding: "12px",
              border: "1px solid #cbd5e1",
              borderRadius: 8,
              fontSize: 12,
              fontFamily: "inherit",
              resize: "vertical",
              outline: "none",
              boxSizing: "border-box"
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

        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            width: "100%",
            padding: "12px",
            background: saving 
              ? "#94a3b8"
              : "linear-gradient(135deg, #0ea5e9 0%, #3b82f6 100%)",
            color: "white",
            border: "none",
            borderRadius: 10,
            fontSize: 14,
            fontWeight: 700,
            cursor: saving ? "not-allowed" : "pointer",
            boxShadow: saving ? "none" : "0 4px 14px rgba(14, 165, 233, 0.35)",
            transition: "all 0.2s ease"
          }}
        >
          {saving ? "Saving..." : "Save Context"}
        </button>
      </div>
    );
  };

  // Integrations Page Component
  const renderIntegrationsPage = () => {
    return (
      <div>
        <div style={{
          background: "white",
          padding: "24px",
          borderRadius: 12,
          marginBottom: 16,
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.06)",
          border: "1px solid #e5e7eb"
        }}>
          <h2 style={{
            fontSize: 18,
            fontWeight: 700,
            color: "#0f172a",
            margin: "0 0 8px 0"
          }}>
            Integrations
          </h2>
          <p style={{
            fontSize: 12,
            color: "#64748b",
            margin: 0,
            lineHeight: 1.5
          }}>
            Connect your tools to streamline your workflow.
          </p>
        </div>

        {/* Email Integration */}
        <div style={{
          background: "white",
          padding: "20px",
          borderRadius: 12,
          marginBottom: 12,
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.06)",
          border: "1px solid #e5e7eb"
        }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 12
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{
                width: 40,
                height: 40,
                borderRadius: 8,
                background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 20
              }}>
                📧
              </div>
              <div>
                <h3 style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: "#0f172a",
                  margin: "0 0 2px 0"
                }}>
                  Email Integration
                </h3>
                <p style={{
                  fontSize: 11,
                  color: "#64748b",
                  margin: 0
                }}>
                  Gmail, Outlook, and more
                </p>
              </div>
            </div>
            <span style={{
              fontSize: 11,
              padding: "4px 10px",
              background: "#fef3c7",
              color: "#92400e",
              borderRadius: 6,
              fontWeight: 600
            }}>
              Coming Soon
            </span>
          </div>
          <p style={{
            fontSize: 12,
            color: "#64748b",
            marginBottom: 12,
            lineHeight: 1.5
          }}>
            Send drafted emails directly from the extension to your email client.
          </p>
          <button
            disabled
            style={{
              width: "100%",
              padding: "10px",
              background: "#f1f5f9",
              color: "#94a3b8",
              border: "1px solid #e2e8f0",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              cursor: "not-allowed"
            }}
          >
            Connect Email
          </button>
        </div>

        {/* CRM Integration */}
        <div style={{
          background: "white",
          padding: "20px",
          borderRadius: 12,
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.06)",
          border: "1px solid #e5e7eb"
        }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 12
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{
                width: 40,
                height: 40,
                borderRadius: 8,
                background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 20
              }}>
                🔗
              </div>
              <div>
                <h3 style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: "#0f172a",
                  margin: "0 0 2px 0"
                }}>
                  CRM Integration
                </h3>
                <p style={{
                  fontSize: 11,
                  color: "#64748b",
                  margin: 0
                }}>
                  Salesforce, HubSpot, and more
                </p>
              </div>
            </div>
            <span style={{
              fontSize: 11,
              padding: "4px 10px",
              background: "#fef3c7",
              color: "#92400e",
              borderRadius: 6,
              fontWeight: 600
            }}>
              Coming Soon
            </span>
          </div>
          <p style={{
            fontSize: 12,
            color: "#64748b",
            marginBottom: 12,
            lineHeight: 1.5
          }}>
            Automatically sync analyzed profiles and activities to your CRM.
          </p>
          <button
            disabled
            style={{
              width: "100%",
              padding: "10px",
              background: "#f1f5f9",
              color: "#94a3b8",
              border: "1px solid #e2e8f0",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              cursor: "not-allowed"
            }}
          >
            Connect CRM
          </button>
        </div>
      </div>
    );
  };

  // Navigation Component
  const renderNavigation = () => (
    <div style={{
      background: "white",
      borderBottom: "2px solid #e5e7eb",
      display: "flex",
      justifyContent: "space-around",
      padding: "0",
      position: "relative",
      boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
    }}>
      {[
        { id: "home" as Page, icon: "🏠", label: "Home" },
        { id: "context" as Page, icon: "👤", label: "Context" },
        { id: "integrations" as Page, icon: "🔌", label: "Integrations" },
      ].map((page) => (
        <button
          key={page.id}
          onClick={() => {
            setCurrentPage(page.id);
            setActionType(null);
            setResponse("");
          }}
          style={{
            flex: 1,
            padding: "14px 8px",
            background: currentPage === page.id ? "#f0f9ff" : "transparent",
            border: "none",
            borderBottom: currentPage === page.id ? "3px solid #0ea5e9" : "3px solid transparent",
            cursor: "pointer",
            fontSize: 11,
            fontWeight: 600,
            color: currentPage === page.id ? "#0ea5e9" : "#64748b",
            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 6,
            position: "relative"
          }}
          onMouseOver={(e) => {
            if (currentPage !== page.id) {
              e.currentTarget.style.background = "#f8fafc";
              e.currentTarget.style.color = "#475569";
              e.currentTarget.style.transform = "translateY(-1px)";
            }
          }}
          onMouseOut={(e) => {
            if (currentPage !== page.id) {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "#64748b";
              e.currentTarget.style.transform = "translateY(0)";
            }
          }}
        >
          <span style={{ 
            fontSize: 20,
            transition: "transform 0.2s ease",
            display: "inline-block"
          }}>{page.icon}</span>
          <span style={{ letterSpacing: "0.3px" }}>{page.label}</span>
        </button>
      ))}
    </div>
  );

  return (
    <div style={{
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', 'SF Pro Display', system-ui, sans-serif",
      width: 420,
      minHeight: 500,
      maxHeight: 600,
      background: "linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)",
      padding: 0,
      margin: 0,
      display: "flex",
      flexDirection: "column",
      overflow: "hidden"
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

      {/* Navigation Menu */}
      {renderNavigation()}

      {/* Content Area - Render based on current page */}
      <div style={{ 
        padding: "24px", 
        flex: 1,
        overflowY: "auto",
        overflowX: "hidden"
      }}>
        {currentPage === "home" && renderHomePage()}
        {currentPage === "context" && renderContextPage()}
        {currentPage === "integrations" && renderIntegrationsPage()}
      </div>

      {/* Enhanced animations and global styles */}
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
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        * {
          box-sizing: border-box;
        }
        button {
          -webkit-tap-highlight-color: transparent;
          user-select: none;
        }
        input, textarea {
          font-family: inherit;
        }
        ::-webkit-scrollbar {
          width: 8px;
        }
        ::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 4px;
        }
        ::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 4px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
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


