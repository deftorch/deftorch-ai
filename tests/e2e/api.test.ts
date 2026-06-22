import { expect } from "@playwright/test";
import { test } from "../fixtures";

const CHAT_URL_REGEX = /\/chat\/[\w-]+/;
const ERROR_TEXT_REGEX = /error|failed|trouble/i;

test.describe("Chat API Integration", () => {
  test("sends message and receives AI response", async ({ chatPage }) => {
    await chatPage.goto();

    await chatPage.sendUserMessage("Hello");

    // Wait for assistant response to appear
    const assistantMessage = chatPage.page.locator("[data-role='assistant']").first();
    await expect(assistantMessage).toBeVisible({ timeout: 30_000 });

    // Verify it has some text content
    const content = await assistantMessage.textContent();
    expect(content?.length).toBeGreaterThan(0);
  });

  test("redirects to /chat/:id after sending message", async ({ chatPage }) => {
    await chatPage.goto();

    await chatPage.sendUserMessage("Test redirect");

    // URL should change to /chat/:id format
    await expect(chatPage.page).toHaveURL(CHAT_URL_REGEX, { timeout: 10_000 });
  });

  test("clears input after sending", async ({ chatPage }) => {
    await chatPage.goto();

    const input = chatPage.getInput();
    await chatPage.sendUserMessage("Test message");

    // Input should be cleared
    await expect(input).toHaveValue("");
  });

  test("shows stop button during generation", async ({ chatPage }) => {
    await chatPage.goto();
    await chatPage.sendUserMessage("Test");

    // Stop button should appear during generation
    const stopButton = chatPage.getStopButton();
    await expect(stopButton).toBeVisible({ timeout: 5000 });
  });
});

test.describe("Chat Error Handling", () => {
  test("handles API error gracefully", async ({ chatPage, page }) => {
    await page.route("**/api/chat", async (route) => {
      await route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ error: "Internal server error" }),
      });
    });

    await chatPage.goto();
    await chatPage.sendUserMessage("Test error");

    // Should show error toast or message
    await expect(page.getByText(ERROR_TEXT_REGEX).first()).toBeVisible({
      timeout: 5000,
    });
  });
});

test.describe("Suggested Actions", () => {
  test("suggested actions are clickable", async ({ chatPage }) => {
    await chatPage.goto();

    const suggestions = chatPage.page.locator(
      "[data-testid='suggested-actions'] button"
    );
    const count = await suggestions.count();

    if (count > 0) {
      await suggestions.first().click();

      // Should redirect after clicking suggestion
      await expect(chatPage.page).toHaveURL(CHAT_URL_REGEX, { timeout: 10_000 });
    }
  });
});
