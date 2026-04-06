import { test as setup } from "@playwright/test";
import { API } from "../constants/api-routes";
import {
  createWorkspace,
  deleteWorkspace,
  type WorkspaceInfo,
} from "../helpers/api";
import { addGiteaDeployKey } from "../helpers/gitea";
import * as fs from "fs";
import * as path from "path";

const STATE_DIR = path.resolve(__dirname, "../.state");
const STATE_FILE = path.join(STATE_DIR, "migration.json");

export interface MigrationState {
  workspaceId: string;
  workspaceName: string;
  appId: string;
  appSlug: string;
  deployKeyId: number;
  repoName: string;
  pages: Record<string, string>;
}

const REPO_NAME = "TED-migration-test-1";
const GIT_CLONE_URL =
  process.env.GIT_CLONE_URL || "git@host.docker.internal:Cypress";

setup("import v1.9.24 migration app via Git", async ({ request }) => {
  const baseURL = process.env.PLAYWRIGHT_BASE_URL || "https://dev.appsmith.com";
  const api = await setup.step("create authenticated API context", async () => {
    return request;
  });

  const workspace: WorkspaceInfo = await setup.step(
    "create workspace",
    async () => {
      const name = `migration-${crypto.randomUUID().slice(0, 8)}`;
      return createWorkspace(api, name);
    },
  );

  const importResult = await setup.step(
    "generate SSH key for import",
    async () => {
      const keysResponse = await api.get(
        `${baseURL}${API.gitImportKeys}?keyType=ECDSA`,
      );
      if (!keysResponse.ok()) {
        throw new Error(
          `Failed to get import keys: ${keysResponse.status()} ${await keysResponse.text()}`,
        );
      }
      const keysBody = await keysResponse.json();
      const publicKey: string = keysBody.data.publicKey;
      const trimmedKey = publicKey.slice(0, publicKey.length - 1);

      const deployKey = await addGiteaDeployKey(
        api,
        REPO_NAME,
        trimmedKey,
        `pw-migration-${Date.now()}`,
      );

      return { publicKey, deployKeyId: deployKey.id ?? deployKey.key_id };
    },
  );

  const app = await setup.step("import app from git", async () => {
    const importResponse = await api.post(
      `${baseURL}${API.gitImport}?workspaceId=${workspace.id}`,
      {
        data: {
          remoteUrl: `${GIT_CLONE_URL}/${REPO_NAME}.git`,
          gitProfile: {},
        },
      },
    );

    if (!importResponse.ok()) {
      throw new Error(
        `Git import failed: ${importResponse.status()} ${await importResponse.text()}`,
      );
    }

    return importResponse.json();
  });

  const appData = app.data?.application ?? app.data;
  const appId = appData.id;
  const appSlug = appData.slug;

  await setup.step("reconnect datasources", async () => {
    const dsListResponse = await api.get(
      `${baseURL}${API.datasources}?applicationId=${appId}`,
    );
    if (!dsListResponse.ok()) {
      throw new Error(`Failed to list datasources: ${dsListResponse.status()}`);
    }
    const dsList = await dsListResponse.json();
    const datasources = dsList.data || [];

    for (const ds of datasources) {
      if (ds.isConfigured === false || ds.invalids?.length > 0) {
        const updateResponse = await api.put(
          `${baseURL}${API.datasources}/${ds.id}`,
          { data: ds },
        );
        if (!updateResponse.ok()) {
          console.warn(
            `Reconnect DS "${ds.name}" returned ${updateResponse.status()} — may already be configured`,
          );
        }
      }
    }
  });

  const pages: Record<string, string> = {};
  await setup.step("map page names to slugs", async () => {
    const pagesList = appData.pages || [];
    for (const p of pagesList) {
      pages[p.slug] = p.slug;
    }
  });

  await setup.step("publish the app", async () => {
    const pubResponse = await api.post(
      `${baseURL}${API.applicationsPublish}/${appId}`,
    );
    if (!pubResponse.ok()) {
      console.warn(
        `Publish returned ${pubResponse.status()} — app may need manual deploy`,
      );
    }
  });

  const state: MigrationState = {
    workspaceId: workspace.id,
    workspaceName: workspace.name,
    appId,
    appSlug,
    deployKeyId: importResult.deployKeyId,
    repoName: REPO_NAME,
    pages,
  };

  fs.mkdirSync(STATE_DIR, { recursive: true });
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
});

setup.afterAll(async () => {
  // Cleanup is intentionally deferred — tests read .state/migration.json.
  // After all regression/git tests finish, a teardown project can clean up.
  // For now, workspace persists for the duration of the test run.
});
