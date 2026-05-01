import type { Page, Locator, Response } from "@playwright/test";

/**
 * Clicks a trigger element and waits for a matching API response.
 * Use this for mutations where you need to assert on the result
 * only after the server has responded.
 */
export async function clickAndWaitForAPI(
  trigger: Locator,
  page: Page,
  urlPattern: string | RegExp,
): Promise<Response> {
  const responsePromise = page.waitForResponse(
    (r) =>
      (typeof urlPattern === "string"
        ? r.url().includes(urlPattern)
        : urlPattern.test(r.url())) && r.ok(),
  );
  await trigger.click();
  return responsePromise;
}

/**
 * Waits for a specific API response matching the URL pattern.
 * Use when the triggering action is not a simple click (e.g. form submit, keyboard).
 */
export async function waitForAPI(
  page: Page,
  urlPattern: string | RegExp,
): Promise<Response> {
  return page.waitForResponse(
    (r) =>
      (typeof urlPattern === "string"
        ? r.url().includes(urlPattern)
        : urlPattern.test(r.url())) && r.ok(),
  );
}
