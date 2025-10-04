console.debug("Sales Curiosity content script loaded");

// Extract LinkedIn profile data from the page
function extractLinkedInProfile() {
  console.log('🔍 Starting LinkedIn profile extraction...');
  console.log('📍 Current URL:', window.location.href);
  
  const profileData: any = {
    url: window.location.href,
    scrapedAt: new Date().toISOString(),
  };

  // AGGRESSIVE EXTRACTION: Get ALL h1 elements and log them
  const allH1s = document.querySelectorAll('h1');
  console.log('Found H1 elements:', allH1s.length);
  allH1s.forEach((h1, i) => {
    console.log(`H1 ${i}:`, h1.textContent?.trim().substring(0, 100));
  });
  
  // Try to get name from first H1 with substantial text
  for (const h1 of allH1s) {
    const text = h1.textContent?.trim();
    if (text && text.length > 2 && text.length < 100) {
      profileData.name = text;
      console.log('✅ Found name:', profileData.name);
      break;
    }
  }

  // Get ALL text from the main content area - this is our safety net
  const mainSelectors = ['main', '[role="main"]', '#main-content', 'body'];
  let mainContent = null;
  
  for (const selector of mainSelectors) {
    mainContent = document.querySelector(selector);
    if (mainContent) {
      console.log('✅ Found main content with selector:', selector);
      break;
    }
  }
  
  if (mainContent) {
    const fullText = mainContent.textContent?.trim() || '';
    profileData.fullPageText = fullText.substring(0, 20000); // Increased to 20k chars
    console.log('✅ Extracted full page text length:', profileData.fullPageText.length);
    console.log('📄 First 200 chars:', profileData.fullPageText.substring(0, 200));
  } else {
    console.error('❌ Could not find main content element!');
    // Ultimate fallback - get ALL text from body
    profileData.fullPageText = document.body.textContent?.trim().substring(0, 20000) || '';
    console.log('⚠️ Using body text as fallback:', profileData.fullPageText.length, 'chars');
  }

  // Try to extract headline from any div with "body-medium" class
  const headlineElements = document.querySelectorAll('[class*="body-medium"]');
  console.log('Found potential headline elements:', headlineElements.length);
  for (const elem of headlineElements) {
    const text = elem.textContent?.trim();
    if (text && text.length > 10 && text.length < 200 && text !== profileData.name) {
      profileData.headline = text;
      console.log('✅ Found headline:', profileData.headline);
      break;
    }
  }

  // Try to extract location from small text elements
  const locationElements = document.querySelectorAll('[class*="body-small"]');
  for (const elem of locationElements) {
    const text = elem.textContent?.trim();
    if (text && text.length > 3 && text.length < 100 && !text.includes('followers') && !text.includes('connections')) {
      profileData.location = text;
      console.log('✅ Found location:', profileData.location);
      break;
    }
  }

  // Simple section extraction by ID
  const sections = ['about', 'experience', 'education', 'skills'];
  sections.forEach(sectionId => {
    const section = document.getElementById(sectionId);
    if (section) {
      const container = section.closest('section');
      if (container) {
        const text = container.textContent?.trim().substring(0, 3000);
        profileData[sectionId + 'Section'] = text;
        console.log(`✅ Found ${sectionId} section:`, text?.length, 'chars');
      }
    }
  });

  // Check if we have ANY data at all
  const hasData = profileData.name || profileData.headline || (profileData.fullPageText && profileData.fullPageText.length > 100);
  
  console.log('🎯 Extraction complete. Has usable data:', hasData);
  console.log('📊 Final profile data summary:', {
    name: profileData.name ? '✅' : '❌',
    headline: profileData.headline ? '✅' : '❌',
    location: profileData.location ? '✅' : '❌',
    fullTextLength: profileData.fullPageText?.length || 0,
    aboutSection: profileData.aboutSection ? '✅' : '❌',
    experienceSection: profileData.experienceSection ? '✅' : '❌',
    educationSection: profileData.educationSection ? '✅' : '❌',
  });

  return profileData;
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "EXTRACT_LINKEDIN_PROFILE") {
    try {
      const profileData = extractLinkedInProfile();
      sendResponse({ success: true, data: profileData });
    } catch (error) {
      sendResponse({ success: false, error: String(error) });
    }
    return true; // Keep the message channel open for async response
  }

  if (message.type === "HIGHLIGHT_LINKS") {
    document.querySelectorAll("a").forEach((a) => {
      (a as HTMLElement).style.outline = "2px solid #22c55e";
    });
  }
});


