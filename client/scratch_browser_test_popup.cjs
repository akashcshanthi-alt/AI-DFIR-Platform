const puppeteer = require('puppeteer-core');

(async () => {
  console.log('=== Starting Browser Popup Test ===');
  
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  page.on('console', msg => {
    console.log(`[MAIN CONSOLE] ${msg.type().toUpperCase()}: ${msg.text()}`);
  });

  page.on('pageerror', err => {
    console.error(`[MAIN PAGE ERROR]:`, err);
  });

  // Keep track of the popup page
  let popupPage = null;

  browser.on('targetcreated', async target => {
    if (target.type() === 'page') {
      const newPage = await target.page();
      const url = newPage.url();
      console.log(`[BROWSER TARGET CREATED] URL: ${url}`);
      
      // If it's a firebase or google auth page, track it
      if (url.includes('firebaseapp.com') || url.includes('accounts.google.com')) {
        popupPage = newPage;
        console.log('[BROWSER TARGET] Identified Auth Popup Page!');
        
        popupPage.on('console', msg => {
          console.log(`[POPUP CONSOLE] ${msg.type().toUpperCase()}: ${msg.text()}`);
        });

        popupPage.on('pageerror', err => {
          console.error(`[POPUP PAGE ERROR]:`, err);
        });
      }
    }
  });

  try {
    console.log('Navigating to http://localhost:5173/login...');
    await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle2' });
    
    console.log('Page loaded. Clicking "Continue with Google" button...');
    const buttonSelector = 'button.trace-login-google-btn';
    await page.waitForSelector(buttonSelector);
    await page.click(buttonSelector);
    
    console.log('Clicked. Waiting for popup target to initialize...');
    
    // Wait up to 5 seconds for popup page
    for (let i = 0; i < 50; i++) {
      if (popupPage) break;
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    if (popupPage) {
      console.log('Popup page detected. Waiting 5 seconds for popup content to load...');
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      console.log(`Popup URL after loading: ${popupPage.url()}`);
      
      // Save screenshot of the popup page
      await popupPage.screenshot({ path: 'C:\\Users\\akash\\.gemini\\antigravity-ide\\brain\\8ce3d364-93cc-467a-9f92-71e32d5bf772\\scratch\\popup_screenshot.png' });
      console.log('Popup screenshot saved to popup_screenshot.png');
    } else {
      console.log('No popup page was detected.');
    }
    
    // Capture screenshot of main page
    await page.screenshot({ path: 'C:\\Users\\akash\\.gemini\\antigravity-ide\\brain\\8ce3d364-93cc-467a-9f92-71e32d5bf772\\scratch\\main_screenshot.png' });
    console.log('Main page screenshot saved.');
    
  } catch (error) {
    console.error('Test execution failed:', error);
  } finally {
    await browser.close();
    console.log('=== Browser Popup Test Finished ===');
  }
})();
