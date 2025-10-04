'use client';

export default function InstallPage() {
  async function downloadExtension() {
    window.location.href = '/extension/sales-curiosity-extension.zip';
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      fontFamily: 'system-ui, sans-serif',
      padding: '20px'
    }}>
      <div style={{
        background: 'white',
        padding: '48px',
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
            Installation Steps:
          </h2>
          
          <ol style={{
            listStyle: 'decimal',
            paddingLeft: '24px',
            color: '#4a5568',
            fontSize: '15px',
            lineHeight: '1.8'
          }}>
            <li style={{ marginBottom: '12px' }}>
              <strong>Download the extension</strong> by clicking the button below
            </li>
            <li style={{ marginBottom: '12px' }}>
              <strong>Unzip the downloaded file</strong> to a folder on your computer
            </li>
            <li style={{ marginBottom: '12px' }}>
              Open Chrome and go to <code style={{
                background: '#e2e8f0',
                padding: '2px 6px',
                borderRadius: '4px',
                fontSize: '14px'
              }}>chrome://extensions/</code>
            </li>
            <li style={{ marginBottom: '12px' }}>
              <strong>Enable "Developer mode"</strong> (toggle in top-right corner)
            </li>
            <li style={{ marginBottom: '12px' }}>
              Click <strong>"Load unpacked"</strong> and select the unzipped folder
            </li>
            <li>
              Navigate to any LinkedIn profile and click the extension icon! 🎉
            </li>
          </ol>
        </div>

        <button
          onClick={downloadExtension}
          style={{
            width: '100%',
            padding: '16px',
            background: '#667eea',
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            fontSize: '18px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'background 0.2s',
            marginBottom: '16px'
          }}
          onMouseOver={(e) => e.currentTarget.style.background = '#5a67d8'}
          onMouseOut={(e) => e.currentTarget.style.background = '#667eea'}
        >
          📥 Download Extension (Beta)
        </button>

        <div style={{
          padding: '16px',
          background: '#fef3c7',
          borderRadius: '8px',
          fontSize: '13px',
          color: '#92400e'
        }}>
          <strong>⚠️ Beta Testing Note:</strong> This is a test version. You'll need to manually load it as an unpacked extension. Once we publish to the Chrome Web Store, installation will be one-click!
        </div>

        <div style={{
          marginTop: '24px',
          textAlign: 'center',
          fontSize: '14px',
          color: '#718096'
        }}>
          Need help? Email: support@yourdomain.com
        </div>
      </div>
    </div>
  );
}

