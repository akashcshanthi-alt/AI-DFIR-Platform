const puppeteer = require('puppeteer-core');

(async () => {
  console.log('=== Starting Browser E2E Test ===');
  
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  
  // Set viewport
  await page.setViewport({ width: 1280, height: 800 });

  // Listen to console logs
  page.on('console', msg => {
    console.log(`[BROWSER CONSOLE] ${msg.type().toUpperCase()}: ${msg.text()}`);
  });

  // Listen to page errors
  page.on('pageerror', err => {
    console.error(`[BROWSER PAGE ERROR]:`, err);
  });

  // Listen to network requests
  page.on('request', request => {
    const url = request.url();
    if (url.includes('/api/') || url.includes('googleapis.com') || url.includes('firebase')) {
      console.log(`[NETWORK REQ] ${request.method()} ${url}`);
    }
  });

  page.on('requestfailed', request => {
    console.log(`[NETWORK REQ FAILED] ${request.url()} - ${request.failure() ? request.failure().errorText : 'Unknown'}`);
  });

  page.on('response', response => {
    const url = response.url();
    if (url.includes('/api/') || url.includes('googleapis.com') || url.includes('firebase')) {
      console.log(`[NETWORK RES] ${response.status()} ${url}`);
    }
  });

  try {
    console.log('Navigating to http://localhost:5173/login...');
    await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle2' });
    
    console.log('Page loaded. Locating "Continue with Google" button...');
    
    const buttonSelector = 'button';
    const buttons = await page.$$eval(buttonSelector, elems => {
      return elems.map(e => ({ text: e.innerText, id: e.id, class: e.className }));
    });
    console.log('Found buttons:', buttons);
    
    const googleBtnIndex = buttons.findIndex(b => b.text.includes('Google') || b.text.includes('Continue with Google'));
    if (googleBtnIndex === -1) {
      throw new Error('Google Sign-in button not found on the page');
    }
    
    console.log(`Clicking button: "${buttons[googleBtnIndex].text}"`);
    const buttonElements = await page.$$(buttonSelector);
    await buttonElements[googleBtnIndex].click();
    
    console.log('Clicked Google button. Waiting for 10 seconds to observe flow...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    // Capture screenshot to see UI state
    await page.screenshot({ path: 'C:\\Users\\akash\\.gemini\\antigravity-ide\\brain\\8ce3d364-93cc-467a-9f92-71e32d5bf772\\scratch\\g_login_screenshot.png' });
    console.log('Screenshot saved.');
    
  } catch (error) {
    console.error('Test execution failed:', error);
  } finally {
    await browser.close();
    console.log('=== Browser E2E Test Finished ===');
  }
})();
