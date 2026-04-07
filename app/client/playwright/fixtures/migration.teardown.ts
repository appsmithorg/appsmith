import { test as teardown } from "@playwright/test";
import { deleteWorkspace } from "../helpers/api";
import { deleteGiteaDeployKey } from "../helpers/gitea";
import type { MigrationState } from "./migration.setup";
import * as fs from "fs";
import * as path from "path";

const STATE_FILE = path.resolve(__dirname, "../.state/migration.json");

teardown("clean up migration workspace and deploy key", async ({ request }) => {
  if (!fs.existsSync(STATE_FILE)) {
    console.warn("No migration state file found — skipping cleanup");
    return;
  }

  const state: MigrationState = JSON.parse(
    fs.readFileSync(STATE_FILE, "utf-8"),
  );

  await teardown.step("delete deploy key", async () => {
    await deleteGiteaDeployKey(request, state.deployKeyId).catch((e) =>
      console.warn(`Deploy key cleanup failed: ${e.message}`),
    );
  });

  await teardown.step("delete workspace (cascades to app)", async () => {
    await deleteWorkspace(request, state.workspaceId).catch((e) =>
      console.warn(`Workspace cleanup failed: ${e.message}`),
    );
  });

  fs.unlinkSync(STATE_FILE);
});
