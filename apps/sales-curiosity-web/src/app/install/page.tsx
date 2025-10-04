'use client';

import { useState } from 'react';

export default function InstallPage() {
  const [step, setStep] = useState(0);
  
  async function downloadExtension() {
    window.location.href = '/sales-curiosity-extension.zip';
    setStep(1);
  }

  function openExtensionsPage() {
    window.open('chrome://extensions/', '_blank');
    setStep(2);
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      fontFamily: 'system-ui, sans-serif',
      padding: '16px'
    }}>
      <div style={{
        background: 'white',
        padding: '24px',
        borderRadius: '16px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        maxWidth: '600px',
        width: '100%'
      }}>
        <h1 style={{
          fontSize: '32px',
          fontWeight: '700',
          marginBottom: '16px',
          color: '#1a202c'
        }}>
          Install Sales Curiosity Extension
        </h1>
        
        <p style={{
          color: '#718096',
          marginBottom: '32px',
          fontSize: '16px',
          lineHeight: '1.6'
        }}>
          Thank you for testing our extension! Follow these simple steps to get started:
        </p>

        <div style={{
          background: '#f7fafc',
          padding: '24px',
          borderRadius: '12px',
          marginBottom: '32px'
        }}>
          <h2 style={{
            fontSize: '18px',
            fontWeight: '600',
            marginBottom: '16px',
            color: '#2d3748'
          }}>
            Quick Installation (3 steps):
          </h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Step 1 */}
            <div style={{
              display: 'flex',
              gap: '16px',
              alignItems: 'start',
              padding: '16px',
              background: step >= 1 ? '#d1fae5' : 'white',
              borderRadius: '10px',
              border: step >= 1 ? '2px solid #10b981' : '2px solid #e2e8f0',
              transition: 'all 0.3s'
            }}>
              <div style={{
                minWidth: '32px',
                height: '32px',
                borderRadius: '50%',
                background: step >= 1 ? '#10b981' : '#667eea',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: '700',
                fontSize: '16px'
              }}>
                {step >= 1 ? '✓' : '1'}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{
                  fontSize: '15px',
                  fontWeight: '600',
                  color: '#1a202c',
                  marginBottom: '8px'
                }}>
                  Download & Unzip
                </div>
                <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '12px' }}>
                  Download the extension file and unzip it to any folder on your computer.
                </p>
                <button
                  onClick={downloadExtension}
                  disabled={step >= 1}
                  style={{
                    padding: '10px 20px',
                    background: step >= 1 ? '#94a3b8' : '#667eea',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: step >= 1 ? 'not-allowed' : 'pointer'
                  }}
                >
                  {step >= 1 ? '✓ Downloaded' : '📥 Download Extension'}
                </button>
              </div>
            </div>

            {/* Step 2 */}
            <div style={{
              display: 'flex',
              gap: '16px',
              alignItems: 'start',
              padding: '16px',
              background: step >= 2 ? '#d1fae5' : 'white',
              borderRadius: '10px',
              border: step >= 2 ? '2px solid #10b981' : '2px solid #e2e8f0',
              transition: 'all 0.3s'
            }}>
              <div style={{
                minWidth: '32px',
                height: '32px',
                borderRadius: '50%',
                background: step >= 2 ? '#10b981' : '#667eea',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: '700',
                fontSize: '16px'
              }}>
                {step >= 2 ? '✓' : '2'}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{
                  fontSize: '15px',
                  fontWeight: '600',
                  color: '#1a202c',
                  marginBottom: '8px'
                }}>
                  Enable Developer Mode in Chrome
                </div>
                <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '8px' }}>
                  Open <code style={{
                    background: '#e2e8f0',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    fontSize: '13px'
                  }}>chrome://extensions/</code> and toggle "Developer mode" in the top-right.
                </p>
                <button
                  onClick={openExtensionsPage}
                  style={{
                    padding: '10px 20px',
                    background: '#667eea',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    marginTop: '4px'
                  }}
                >
                  🔧 Open chrome://extensions/
                </button>
              </div>
            </div>

            {/* Step 3 */}
            <div style={{
              display: 'flex',
              gap: '16px',
              alignItems: 'start',
              padding: '16px',
              background: 'white',
              borderRadius: '10px',
              border: '2px solid #e2e8f0'
            }}>
              <div style={{
                minWidth: '32px',
                height: '32px',
                borderRadius: '50%',
                background: '#667eea',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: '700',
                fontSize: '16px'
              }}>
                3
              </div>
              <div style={{ flex: 1 }}>
                <div style={{
                  fontSize: '15px',
                  fontWeight: '600',
                  color: '#1a202c',
                  marginBottom: '8px'
                }}>
                  Load Unpacked Extension
                </div>
                <p style={{ fontSize: '14px', color: '#64748b' }}>
                  Click <strong>"Load unpacked"</strong> button and select the <strong>dist</strong> folder inside the unzipped extension folder.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Visual Guide */}
        <div style={{
          background: '#eff6ff',
          padding: '20px',
          borderRadius: '12px',
          marginBottom: '24px',
          border: '2px solid #93c5fd'
        }}>
          <div style={{
            fontSize: '14px',
            fontWeight: '600',
            color: '#1e3a8a',
            marginBottom: '12px'
          }}>
            💡 Quick Tip: Find the "dist" folder
          </div>
          <p style={{
            fontSize: '13px',
            color: '#1e40af',
            lineHeight: '1.6',
            margin: 0
          }}>
            After unzipping, you'll see folders like <code style={{
              background: 'white',
              padding: '2px 6px',
              borderRadius: '4px'
            }}>src</code>, <code style={{
              background: 'white',
              padding: '2px 6px',
              borderRadius: '4px'
            }}>dist</code>, etc. <strong>Select the "dist" folder</strong> when clicking "Load unpacked" - this is the compiled extension that Chrome needs.
          </p>
        </div>

        {/* Single Download Button */}
        {step === 0 && (
          <button
            onClick={downloadExtension}
            style={{
              width: '100%',
              padding: '18px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontSize: '18px',
              fontWeight: '700',
              cursor: 'pointer',
              transition: 'all 0.3s',
              boxShadow: '0 10px 30px rgba(102, 126, 234, 0.4)',
              marginBottom: '16px'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 15px 40px rgba(102, 126, 234, 0.5)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 10px 30px rgba(102, 126, 234, 0.4)';
            }}
          >
            📥 Download Extension Now
          </button>
        )}

        <div style={{
          padding: '16px',
          background: '#fef3c7',
          borderRadius: '8px',
          fontSize: '13px',
          color: '#92400e',
          marginBottom: '24px'
        }}>
          <strong>⚠️ Beta Testing Note:</strong> This is a developer version for testing. Once we publish to the Chrome Web Store, installation will be one-click!
        </div>

        {/* Success Message */}
        {step > 0 && (
          <div style={{
            padding: '20px',
            background: '#d1fae5',
            borderRadius: '12px',
            border: '2px solid #10b981',
            marginBottom: '20px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>🎉</div>
            <div style={{
              fontSize: '18px',
              fontWeight: '700',
              color: '#065f46',
              marginBottom: '8px'
            }}>
              Almost There!
            </div>
            <p style={{
              fontSize: '14px',
              color: '#047857',
              lineHeight: '1.6'
            }}>
              {step === 1 && 'File downloaded! Now unzip it and follow step 2.'}
              {step === 2 && 'Great! Now enable Developer mode and click "Load unpacked" to select the dist folder.'}
            </p>
          </div>
        )}

        <div style={{
          marginTop: '24px',
          padding: '16px',
          background: '#f7fafc',
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <div style={{
            fontSize: '14px',
            fontWeight: '600',
            color: '#2d3748',
            marginBottom: '8px'
          }}>
            Having Issues?
          </div>
          <p style={{
            fontSize: '13px',
            color: '#64748b',
            marginBottom: '12px'
          }}>
            Make sure you select the <strong>dist</strong> folder (not the root folder). The dist folder contains the compiled extension files.
          </p>
          <a
            href="/"
            style={{
              color: '#667eea',
              fontWeight: '600',
              fontSize: '14px',
              textDecoration: 'none'
            }}
          >
            ← Back to Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}

