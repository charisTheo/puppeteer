/* eslint-disable rulesdir/check-license */
import puppeteer from './packages/puppeteer/lib/esm/puppeteer/puppeteer.js';

async function checkStorageAccessPermission() {
  const browser = await puppeteer.launch({
    headless: false,
    args: ['--test-third-party-cookie-phaseout'],
    executablePath: `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`,
  });

  const page = await browser.newPage();

  // Interact with the 3rd party page so storage access can be requested later
  await page.goto('https://storage-access-api-demo.glitch.me/');
  await page.type('#cookieInput', 'bar');
  await page.click('#setCookie');

  // Navigate to the main site.
  await page.goto('https://storage-access-api-demo-site-b.glitch.me/');

  await new Promise(res => {
    setTimeout(res, 2000);
  });

  const frames = await page.frames();
  const frame = frames[1]; // "Read Cookie App" iframe
  await frame.click('#refresh-cookies');

  // Override permissions to grant storage access.
  // TODO Add for which top-level site this permission is granted for.
  const context = page.browserContext();
  await context.overridePermissions(
    'https://storage-access-api-demo.glitch.me',
    ['storage-access'],
  );

  // Attempt to get storage access permissions
  const storageAccessGranted = await page.evaluate(async () => {
    try {
      const result = await navigator.permissions.query({
        name: 'storage-access',
      });
      console.log('👨‍💻 | storageAccessGranted | state:', result.state);
      return result.state === 'granted';
    } catch (error) {
      console.log('🪲 | storageAccessGranted | error:', error);
      return false;
    }
  });

  // Check if storage access was granted.
  if (storageAccessGranted) {
    console.log('Storage access was granted.');
  } else {
    console.log('Storage access was not granted.');
  }

  await browser.close();

  return storageAccessGranted;
}

checkStorageAccessPermission().then(granted => {
  console.log('Final result:', granted);
});
