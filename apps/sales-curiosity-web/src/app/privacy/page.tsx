export default function PrivacyPage() {
  return (
    <div style={{
      maxWidth: '800px',
      margin: '40px auto',
      padding: '40px 20px',
      fontFamily: 'system-ui, sans-serif',
      lineHeight: '1.7',
      color: '#2d3748'
    }}>
      <h1 style={{ fontSize: '36px', fontWeight: '700', marginBottom: '12px', color: '#1a202c' }}>
        Privacy Policy
      </h1>
      <p style={{ color: '#718096', marginBottom: '32px' }}>
        <strong>Last Updated: October 4, 2025</strong>
      </p>
      
      <section style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '16px', color: '#1a202c' }}>
          1. Information We Collect
        </h2>
        <p style={{ marginBottom: '12px' }}>
          Sales Curiosity collects the following information when you use our extension:
        </p>
        <ul style={{ paddingLeft: '24px', marginBottom: '16px' }}>
          <li style={{ marginBottom: '8px' }}>
            <strong>Account Information:</strong> Email address and name when you create an account
          </li>
          <li style={{ marginBottom: '8px' }}>
            <strong>LinkedIn Profile Data:</strong> URLs and public profile information from LinkedIn pages you analyze
          </li>
          <li style={{ marginBottom: '8px' }}>
            <strong>Analysis Results:</strong> AI-generated insights and reports you create
          </li>
          <li style={{ marginBottom: '8px' }}>
            <strong>Usage Data:</strong> Extension usage patterns and preferences
          </li>
        </ul>
      </section>

      <section style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '16px', color: '#1a202c' }}>
          2. How We Use Your Information
        </h2>
        <p style={{ marginBottom: '12px' }}>
          We use the collected information to:
        </p>
        <ul style={{ paddingLeft: '24px', marginBottom: '16px' }}>
          <li style={{ marginBottom: '8px' }}>Provide AI-powered LinkedIn profile analysis</li>
          <li style={{ marginBottom: '8px' }}>Store your analysis history for future reference</li>
          <li style={{ marginBottom: '8px' }}>Improve our service and user experience</li>
          <li style={{ marginBottom: '8px' }}>Send service-related notifications</li>
          <li style={{ marginBottom: '8px' }}>Prevent fraud and ensure security</li>
        </ul>
      </section>

      <section style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '16px', color: '#1a202c' }}>
          3. Data Sharing and Third Parties
        </h2>
        <p style={{ marginBottom: '12px' }}>
          We do <strong>NOT</strong>:
        </p>
        <ul style={{ paddingLeft: '24px', marginBottom: '16px' }}>
          <li style={{ marginBottom: '8px' }}>Sell your personal information to third parties</li>
          <li style={{ marginBottom: '8px' }}>Share your data for advertising purposes</li>
          <li style={{ marginBottom: '8px' }}>Disclose your information except as described below</li>
        </ul>
        
        <p style={{ marginBottom: '12px', marginTop: '16px' }}>
          We <strong>DO</strong> use these trusted service providers:
        </p>
        <ul style={{ paddingLeft: '24px', marginBottom: '16px' }}>
          <li style={{ marginBottom: '8px' }}>
            <strong>OpenAI:</strong> For AI-powered analysis (subject to their privacy policy)
          </li>
          <li style={{ marginBottom: '8px' }}>
            <strong>Supabase:</strong> For secure data storage and authentication
          </li>
          <li style={{ marginBottom: '8px' }}>
            <strong>Vercel:</strong> For hosting our application
          </li>
        </ul>
      </section>

      <section style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '16px', color: '#1a202c' }}>
          4. Data Storage and Security
        </h2>
        <p style={{ marginBottom: '12px' }}>
          We implement industry-standard security measures to protect your data:
        </p>
        <ul style={{ paddingLeft: '24px', marginBottom: '16px' }}>
          <li style={{ marginBottom: '8px' }}>All data is encrypted in transit using HTTPS</li>
          <li style={{ marginBottom: '8px' }}>Passwords are securely hashed and never stored in plain text</li>
          <li style={{ marginBottom: '8px' }}>Data is stored in secure, access-controlled databases</li>
          <li style={{ marginBottom: '8px' }}>Regular security audits and updates</li>
        </ul>
      </section>

      <section style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '16px', color: '#1a202c' }}>
          5. Permissions Required
        </h2>
        <p style={{ marginBottom: '12px' }}>
          Our Chrome extension requests the following permissions:
        </p>
        <ul style={{ paddingLeft: '24px', marginBottom: '16px' }}>
          <li style={{ marginBottom: '8px' }}>
            <strong>storage:</strong> To save your preferences and API settings locally
          </li>
          <li style={{ marginBottom: '8px' }}>
            <strong>activeTab:</strong> To analyze the current LinkedIn profile you're viewing
          </li>
          <li style={{ marginBottom: '8px' }}>
            <strong>scripting:</strong> To extract public profile information from LinkedIn pages
          </li>
          <li style={{ marginBottom: '8px' }}>
            <strong>tabs:</strong> To get the URL of the current LinkedIn profile
          </li>
        </ul>
        <p>
          These permissions are only used for the functionality described and never for tracking or data collection beyond what's necessary for the service.
        </p>
      </section>

      <section style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '16px', color: '#1a202c' }}>
          6. Your Rights and Choices
        </h2>
        <p style={{ marginBottom: '12px' }}>
          You have the right to:
        </p>
        <ul style={{ paddingLeft: '24px', marginBottom: '16px' }}>
          <li style={{ marginBottom: '8px' }}>Access your personal data</li>
          <li style={{ marginBottom: '8px' }}>Request correction of your data</li>
          <li style={{ marginBottom: '8px' }}>Request deletion of your account and data</li>
          <li style={{ marginBottom: '8px' }}>Export your analysis history</li>
          <li style={{ marginBottom: '8px' }}>Opt-out of non-essential data collection</li>
        </ul>
        <p>
          To exercise these rights, please contact us at the email below.
        </p>
      </section>

      <section style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '16px', color: '#1a202c' }}>
          7. Data Retention
        </h2>
        <p>
          We retain your data for as long as your account is active or as needed to provide you services. 
          You can request deletion of your data at any time. After account deletion, your data will be 
          permanently removed within 30 days, except where we are required to retain it for legal obligations.
        </p>
      </section>

      <section style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '16px', color: '#1a202c' }}>
          8. Children's Privacy
        </h2>
        <p>
          Our service is not intended for children under 13 years of age. We do not knowingly collect 
          personal information from children under 13. If you believe we have collected information from 
          a child under 13, please contact us immediately.
        </p>
      </section>

      <section style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '16px', color: '#1a202c' }}>
          9. Changes to This Policy
        </h2>
        <p>
          We may update this privacy policy from time to time. We will notify you of any changes by 
          posting the new policy on this page and updating the "Last Updated" date. You are advised to 
          review this policy periodically for any changes.
        </p>
      </section>

      <section style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '16px', color: '#1a202c' }}>
          10. Contact Us
        </h2>
        <p style={{ marginBottom: '8px' }}>
          If you have any questions about this Privacy Policy or our data practices, please contact us at:
        </p>
        <p style={{ marginBottom: '8px' }}>
          <strong>Email:</strong> privacy@curiosityengine.com
        </p>
        <p>
          <strong>Website:</strong> https://curiosityengine-sales-curiosity-web.vercel.app
        </p>
      </section>

      <div style={{
        marginTop: '48px',
        paddingTop: '24px',
        borderTop: '1px solid #e2e8f0',
        textAlign: 'center',
        color: '#718096',
        fontSize: '14px'
      }}>
        <p>© 2025 Sales Curiosity. All rights reserved.</p>
      </div>
    </div>
  );
}

