const { chromium } = require("playwright");

(async () => {
  const context = await chromium.launchPersistentContext(
    "D:\\pw-profile-examice",
    {
      channel: "chrome",
      headless: false,
      viewport: { width: 1280, height: 1600 },
    }
  );

  const page = await context.newPage();
  await page.goto("https://examice.com/exams/amazon/clf-c02/?page=1");
})();
