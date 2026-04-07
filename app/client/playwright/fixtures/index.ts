import { test as base, type APIRequestContext } from "@playwright/test";
import {
  createWorkspace,
  deleteWorkspace,
  createApp,
  type WorkspaceInfo,
  type AppInfo,
} from "../helpers/api";
import { expect as matcherExpect } from "../matchers";
import { BASE_FLAG_OVERRIDES } from "../config/feature-flags";

interface AppFixtures {
  api: APIRequestContext;
  workspace: WorkspaceInfo;
  app: AppInfo;
  flagOverrides: Record<string, boolean>;
}

export const test = base.extend<AppFixtures>({
  flagOverrides: [
    async ({ page }, use) => {
      const envOverrides = JSON.parse(process.env.PW_FLAG_OVERRIDES || "{}");
      const merged = { ...BASE_FLAG_OVERRIDES, ...envOverrides };

      if (Object.keys(merged).length > 0) {
        await page.route("**/api/v1/users/features", async (route) => {
          const response = await route.fetch();
          const json = await response.json();
          json.data = { ...json.data, ...merged };
          await route.fulfill({ json });
        });

        await page.route("**/api/v1/consolidated-api/*", async (route) => {
          const response = await route.fetch();
          const json = await response.json();
          if (json.data?.featureFlags?.data) {
            json.data.featureFlags.data = {
              ...json.data.featureFlags.data,
              ...merged,
            };
          }
          await route.fulfill({ json });
        });
      }

      await use(merged);
    },
    { auto: true },
  ],

  api: async ({ playwright }, use) => {
    const ctx = await playwright.request.newContext({
      baseURL: process.env.PLAYWRIGHT_BASE_URL || "https://dev.appsmith.com",
      storageState: "playwright/auth/user.json",
    });
    await use(ctx);
    await ctx.dispose();
  },

  workspace: async ({ api }, use) => {
    const name = `ws-${crypto.randomUUID().slice(0, 8)}`;
    const ws = await createWorkspace(api, name);
    await use(ws);
    await deleteWorkspace(api, ws.id).catch(() => {});
  },

  app: async ({ api, workspace }, use) => {
    const name = `app-${crypto.randomUUID().slice(0, 8)}`;
    const app = await createApp(api, workspace.id, name);
    await use(app);
  },
});

export { matcherExpect as expect };
