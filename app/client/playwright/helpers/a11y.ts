import AxeBuilder from "@axe-core/playwright";
import type { Page } from "@playwright/test";
import type { AxeResults } from "axe-core";

/**
 * Runs an axe accessibility audit on the current page.
 * Targets WCAG 2.1 AA compliance by default.
 */
export async function checkAccessibility(
  page: Page,
  options?: { disableRules?: string[] },
): Promise<AxeResults> {
  let builder = new AxeBuilder({ page }).withTags([
    "wcag2a",
    "wcag2aa",
    "wcag21a",
    "wcag21aa",
  ]);

  if (options?.disableRules?.length) {
    builder = builder.disableRules(options.disableRules);
  }

  return builder.analyze();
}
