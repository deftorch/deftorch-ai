import { expect } from "@playwright/test";
import { test } from "../fixtures";

test.describe("Chat Page", () => {
  test("home page loads with input field", async ({ chatPage }) => {
    await chatPage.goto();
    await expect(chatPage.getInput()).toBeVisible();
  });

  test("can type in the input field", async ({ chatPage }) => {
    await chatPage.goto();
    const input = chatPage.getInput();
    await input.fill("Hello world");
    await expect(input).toHaveValue("Hello world");
  });

  test("submit button is visible", async ({ chatPage }) => {
    await chatPage.goto();
    await expect(chatPage.getSendButton()).toBeVisible();
  });

  test("suggested actions are visible on empty chat", async ({ chatPage }) => {
    await chatPage.goto();
    const suggestions = chatPage.page.locator("[data-testid='suggested-actions']");
    await expect(suggestions).toBeVisible();
  });

  test("stop button is visible during generation", async ({ chatPage, page }) => {
    await page.route("**/api/chat", async (route) => {
      // Delay fulfillment to ensure generation state is active
      await new Promise(resolve => setTimeout(resolve, 1000));
      await route.fulfill({ status: 200, body: "Mocked response" });
    });

    await chatPage.goto();
    await chatPage.sendUserMessage("Hello");

    const stopButton = chatPage.getStopButton();
    await expect(stopButton).toBeVisible();
  });
});

test.describe("Chat Input Features", () => {
  test("input clears after sending", async ({ chatPage }) => {
    await chatPage.goto();
    const input = chatPage.getInput();
    await chatPage.sendUserMessage("Test message");

    // Input should clear after sending
    await expect(input).toHaveValue("");
  });

  test("input supports multiline text", async ({ chatPage }) => {
    await chatPage.goto();
    const input = chatPage.getInput();
    await input.fill("Line 1\nLine 2\nLine 3");
    await expect(input).toContainText("Line 1");
  });
});
