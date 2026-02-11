const { chromium } = require("playwright");
const { PDFDocument } = require("pdf-lib");
const fs = require("fs");
const path = require("path");

// ========= CONFIG =========
// Đã chuyển sang Google Associate Cloud Engineer
const USER_DATA_DIR = "D:\\pw-profile-examice"; // profile đã login
const START = 1;
const END = 66; // 326 câu / 5 câu mỗi trang
const URL = (i) =>
  `https://examice.com/exams/google/associate-cloud-engineer/?page=${i}`;
const OUT_DIR = "out";
const PDF_NAME = "examice-google-associate-cloud-engineer.pdf";
const VIEWPORT = { width: 1280, height: 1600 };
// ==========================

// Scroll để load hết nội dung
async function autoScroll(page, step = 1200, pause = 120) {
  await page.evaluate(
    async ({ step, pause }) => {
      await new Promise((resolve) => {
        let total = 0;
        const el = document.scrollingElement || document.documentElement;
        const timer = setInterval(() => {
          const max = el.scrollHeight - window.innerHeight - 5;
          window.scrollBy(0, step);
          total = Math.min(max, total + step);
          if (total >= max) {
            clearInterval(timer);
            resolve();
          }
        }, pause);
      });
    },
    { step, pause }
  );
}

(async () => {
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR);

  // mở Chrome với profile đã login
  const context = await chromium.launchPersistentContext(USER_DATA_DIR, {
    channel: "chrome",
    headless: true, // đổi false nếu muốn xem chạy
    viewport: VIEWPORT,
  });

  const page = await context.newPage();
  const images = [];

  for (let i = START; i <= END; i++) {
    const url = URL(i);
    console.log(`📄 Page ${i}: ${url}`);

    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });
    try {
      await page.waitForLoadState("networkidle", { timeout: 10000 });
    } catch {}

    await autoScroll(page);
    await page.waitForTimeout(300);

    // Chọn đáp án và bấm Answer cho từng câu (5 câu mỗi trang, Google ACE)
    for (let q = 1; q <= 5; q++) {
      // Chọn đáp án A cho câu hỏi q (checkbox có span 'A.')
      await page.evaluate((q) => {
        // Tìm tất cả fieldset (mỗi fieldset là 1 câu hỏi)
        const fieldsets = Array.from(document.querySelectorAll("fieldset"));
        const fieldset = fieldsets[q - 1];
        if (!fieldset) return;
        // Tìm đáp án A: div chứa span có text 'A.'
        const answerDivs = Array.from(fieldset.querySelectorAll("div.flex"));
        const aDiv = answerDivs.find((div) => {
          const span = div.querySelector("span");
          return span && span.textContent.trim().startsWith("A.");
        });
        if (!aDiv) return;
        const checkbox = aDiv.querySelector('input[type="checkbox"]');
        if (checkbox && !checkbox.checked) checkbox.click();
      }, q);

      // Bấm nút Answer cho câu hỏi q (button có span chứa 'Answer')
      await page.evaluate((q) => {
        const fieldsets = Array.from(document.querySelectorAll("fieldset"));
        const fieldset = fieldsets[q - 1];
        if (!fieldset) return;
        // Tìm button có span chứa 'Answer'
        const btns = Array.from(
          fieldset.parentElement.querySelectorAll("button")
        );
        const answerBtn = btns.find((btn) => {
          const span = btn.querySelector("span");
          return span && span.textContent.trim() === "Answer";
        });
        if (answerBtn) answerBtn.click();
      }, q);

      // Đợi hiệu ứng hoặc submit xong (tùy web, có thể tăng thời gian nếu cần)
      await page.waitForTimeout(1000);
    }

    const imgPath = path.join(
      OUT_DIR,
      `page_${String(i).padStart(3, "0")}.png`
    );
    await page.screenshot({ path: imgPath, fullPage: true });
    images.push(imgPath);

    console.log(`✅ Saved ${imgPath}`);
  }

  await context.close();

  // ===== Ghép PDF =====
  console.log("📕 Ghép PDF...");
  const pdfDoc = await PDFDocument.create();

  for (const img of images) {
    const bytes = fs.readFileSync(img);
    const png = await pdfDoc.embedPng(bytes);
    const { width, height } = png.size();

    // mỗi ảnh = 1 trang PDF, không scale méo
    const page = pdfDoc.addPage([width, height]);
    page.drawImage(png, { x: 0, y: 0, width, height });
  }

  const pdfBytes = await pdfDoc.save();
  fs.writeFileSync(PDF_NAME, pdfBytes);

  console.log(`🎉 DONE! PDF: ${PDF_NAME}`);
})();
