import { test, expect } from '@playwright/test';

// 1. Configure the Playwright test to launch with fake UI for media streams
// so it automatically bypasses frustrating popup camera permissions.
test.use({
  launchOptions: {
    args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'],
  },
});

test.describe('KinetiCalm AAC End-to-End Tests', () => {

  // 2. Setup & Mocking - Inject the Speech Synthesis mock before the App loads
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      // Create a global array to capture TTS attempts instead of playing audio during testing
      window.__spokenTexts = [];

      const mockSynth = {
        speak: (utterance) => {
          window.__spokenTexts.push(utterance.text);
        },
        cancel: () => { },
        getVoices: () => [{ name: 'Mock Voice', lang: 'en-US' }]
      };

      // Safely override the read-only window.speechSynthesis object
      Object.defineProperty(window, 'speechSynthesis', {
        value: mockSynth,
        configurable: true
      });
    });

    // Navigate to the Vite development server before each test
    await page.goto('http://localhost:5173/');
  });

  // 3. Foundation Test
  test('Page loads properly with video feed and AAC Action Cards', async ({ page }) => {
    // Assert page metadata is correct
    await expect(page).toHaveTitle(/KinetiCalm/);

    // Assert webcam <video> element exists in the DOM for MediaPipe
    const videoLocator = page.locator('video');
    await expect(videoLocator).toBeAttached();

    // Assert that at least 4 elements with data-dwellable="true" are visible in the viewport
    const dwellableCards = page.locator('[data-dwellable="true"]');

    // Evaluate exact count
    const count = await dwellableCards.count();
    expect(count).toBeGreaterThanOrEqual(4);

    // Verify first card can be physically seen by users (not hidden)
    await expect(dwellableCards.first()).toBeVisible();
  });

  // 4. The Dwell-to-Click & Audio Test
  test('Cursor triggers "Dwell-to-Click" after resting for 1.5 seconds', async ({ page }) => {
    // Discover the exact screen layout bounding box of our specific test card
    const targetCard = page.locator('[data-dwellable="true"]', { hasText: 'I need water' });
    const box = await targetCard.boundingBox();
    expect(box).not.toBeNull();

    // Calculate center-point coordinates
    const targetX = box.x + box.width / 2;
    const targetY = box.y + box.height / 2;

    // Invoke our exposed global test hook, forcing the cursor DIRECTLY over the card
    await page.evaluate(({ x, y }) => {
      if (window.forceCursorPosition) {
        window.forceCursorPosition(x, y);
      } else {
        throw new Error('window.forceCursorPosition is not exposed on the client window');
      }
    }, { x: targetX, y: targetY });

    // Give the headless browser up to 3000ms to complete its 1500ms animation frames
    // This explicitly accounts for frame throttling and the internal SMA smoothing inertia.
    await expect(async () => {
      const spokenArray = await page.evaluate(() => window.__spokenTexts || []);
      // Assert that the audio system was told to say exactly 'I need water'
      expect(spokenArray).toContain('I need water');
      // Ensure it wasn't multi-clicking or re-triggering constantly
      expect(spokenArray.length).toBe(1);
    }).toPass({ timeout: 3000 });
  });

  // 5. The Cancel Test (Anti-Spam Filter)
  test('Cursor correctly resets the dwell timer if moved away prematurely', async ({ page }) => {
    const targetCard = page.locator('[data-dwellable="true"]', { hasText: 'No' });
    const box = await targetCard.boundingBox();
    expect(box).not.toBeNull();

    // 5a. Force the cursor ONTO the card
    await page.evaluate(({ x, y }) => {
      window.forceCursorPosition(x, y);
    }, { x: box.x + 10, y: box.y + 10 });

    // 5b. Wait ONLY 800ms — just over halfway, but not enough to trigger the 1500ms limit
    await page.waitForTimeout(800);

    // 5c. Force the cursor entirely OFF the card and out of bounds (0, 0)
    await page.evaluate(() => {
      window.forceCursorPosition(0, 0);
    });

    // Wait an extra 1000ms. If the timer didn't reset, it would inevitably hit 1500ms and fire a click.
    await page.waitForTimeout(1000);

    // Retrieve the TTS array to check for leaked events
    const spokenArray = await page.evaluate(() => window.__spokenTexts);

    // Assert that NOTHING was spoken (length strictly 0)
    expect(spokenArray.length).toBe(0);
  });
});
