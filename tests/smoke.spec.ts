import { test, expect } from "@playwright/test";

test.describe("Ticket War Bot Smoke Tests", () => {
  test("SHOULD launch Chromium AND open a page", async ({ page }) => {
    await page.goto("about:blank");

    expect(page.url()).toBe("about:blank");
  });

  test("SHOULD render local HTML content", async ({ page }) => {
    await page.setContent(`
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <title>Ticket War Bot</title>
        </head>

        <body>
          <h1>Ticket War Bot</h1>
          <p>Browser automation is ready</p>
        </body>
      </html>
    `);

    await expect(
      page.getByRole("heading", {
        name: "Ticket War Bot",
      }),
    ).toBeVisible();

    await expect(
      page.getByText("Browser automation is ready"),
    ).toBeVisible();
  });

  test("SHOULD interact with a button", async ({ page }) => {
    await page.setContent(`
      <!DOCTYPE html>
      <html lang="en">
        <body>
          <button id="test-button">
            Click Me
          </button>

          <p id="result"></p>

          <script>
            document
              .getElementById("test-button")
              .addEventListener("click", () => {
                document.getElementById("result").textContent =
                  "Button clicked successfully";
              });
          </script>
        </body>
      </html>
    `);

    await page.getByRole("button", {
      name: "Click Me",
    }).click();

    await expect(
      page.getByText("Button clicked successfully"),
    ).toBeVisible();
  });
});