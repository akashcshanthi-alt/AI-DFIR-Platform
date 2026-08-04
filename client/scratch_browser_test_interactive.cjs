const puppeteer = require('puppeteer-core');

(async () => {
  console.log('=== Starting Interactive Browser E2E Test ===');
  console.log('We will launch Chrome in GUI mode.');
  console.log('Please click/select your Google Account in the popup window that appears.');
  
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: false, // GUI mode
    defaultViewport: null, // use full size
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  
  // Listen to console logs
  page.on('console', msg => {
    console.log(`[MAIN CONSOLE] ${msg.type().toUpperCase()}: ${msg.text()}`);
  });

  // Listen to page errors
  page.on('pageerror', err => {
    console.error(`[MAIN PAGE ERROR]:`, err);
  });

  // Track the POST /api/auth/google request
  let apiCallStatus = null;
  let apiCallData = null;

  page.on('request', request => {
    const url = request.url();
    if (url.includes('/api/auth/google')) {
      console.log(`[NETWORK REQ] ${request.method()} ${url}`);
    }
  });

  page.on('response', async response => {
    const url = response.url();
    if (url.includes('/api/auth/google')) {
      apiCallStatus = response.status();
      console.log(`[NETWORK RES] ${apiCallStatus} ${url}`);
      try {
        const text = await response.text();
        console.log(`[NETWORK RES BODY] ${text}`);
      } catch (err) {
        console.error('Could not read response body:', err.message);
      }
    }
  });

  try {
    console.log('Navigating to http://localhost:5173/login...');
    await page.goto('http://localhost:5173/login');
    
    console.log('Page loaded. Locating "Continue with Google" button...');
    const buttonSelector = 'button.trace-login-google-btn';
    await page.waitForSelector(buttonSelector);
    
    console.log('Clicking Google button...');
    await page.click(buttonSelector);
    
    console.log('Google Popup opened. Waiting up to 120 seconds for you to complete authentication in the popup...');
    
    let authenticated = false;
    for (let i = 0; i < 1200; i++) {
      const currentUrl = page.url();
      if (currentUrl.includes('/dashboard')) {
        authenticated = true;
        console.log(`\n[SUCCESS] Redirect to dashboard detected: ${currentUrl}`);
        break;
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    if (authenticated) {
      console.log('Authentication completed successfully!');
      // Wait a moment for dashboard to load
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Capture dashboard screenshot
      await page.screenshot({ path: 'C:\\Users\\akash\\.gemini\\antigravity-ide\\brain\\8ce3d364-93cc-467a-9f92-71e32d5bf772\\scratch\\dashboard_screenshot.png' });
      console.log('Dashboard screenshot saved to scratch/dashboard_screenshot.png');
    } else {
      console.log('\n[TIMEOUT] Google authentication was not completed within 120 seconds.');
    }
    
  } catch (error) {
    console.error('Test execution encountered an error:', error);
  } finally {
    await browser.close();
    console.log('=== Interactive E2E Test Finished ===');
  }
})();
