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

export interface MigrationPage {
  id: string;
  baseId: string;
  slug: string;
}

export interface MigrationState {
  workspaceId: string;
  workspaceName: string;
  appId: string;
  appSlug: string;
  branchName: string;
  deployKeyId: number;
  repoName: string;
  /** slug → { id, baseId, slug } for each page in the imported app */
  pages: Record<string, MigrationPage>;
  /** Raw application object from the git import response — useful for debugging */
  importedAppData: Record<string, unknown>;
}

const REPO_NAME = "TED-migration-test-1";
const GIT_CLONE_URL =
  process.env.GIT_CLONE_URL || "git@host.docker.internal:Cypress";

const DS_HOST = process.env.DATASOURCE_HOST || "host.docker.internal";

const DS_CONFIGS: Record<
  string,
  {
    connection: Record<string, unknown>;
    endpoints: Array<{ host: string; port: number }>;
    authentication: Record<string, unknown>;
    properties: Array<Record<string, string>>;
  }
> = {
  "postgres-plugin": {
    connection: { mode: "READ_WRITE", ssl: { authType: "DEFAULT" } },
    endpoints: [{ host: DS_HOST, port: 5433 }],
    authentication: {
      authenticationType: "dbAuth",
      username: "docker",
      password: "docker",
      databaseName: "fakeapi",
    },
    properties: [],
  },
  "mysql-plugin": {
    connection: { mode: "READ_WRITE", ssl: { authType: "DEFAULT" } },
    endpoints: [{ host: DS_HOST, port: 3306 }],
    authentication: {
      authenticationType: "dbAuth",
      username: "root",
      password: "root",
      databaseName: "fakeapi",
    },
    properties: [{ key: "Connection method", value: "STANDARD" }],
  },
  "mongo-plugin": {
    connection: {
      mode: "READ_WRITE",
      type: "DIRECT",
      ssl: { authType: "DEFAULT" },
    },
    endpoints: [{ host: DS_HOST, port: 28017 }],
    authentication: {
      authType: "SCRAM_SHA_1",
      authenticationType: "dbAuth",
      databaseName: "mongo_prod",
    },
    properties: [
      {
        key: "Use mongo connection string URI",
        value: "No",
      },
      {
        key: "Connection string URI",
      },
    ],
  },
};

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
  const branchName =
    appData.gitApplicationMetadata?.branchName ??
    appData.gitApplicationMetadata?.defaultBranchName ??
    "master";

  console.log(`App: id=${appId}, slug=${appSlug}, branch=${branchName}`);

  await setup.step("reconnect datasources", async () => {
    const pluginsResponse = await api.get(
      `${baseURL}${API.plugins}?workspaceId=${workspace.id}`,
    );
    if (!pluginsResponse.ok()) {
      throw new Error(`Failed to list plugins: ${pluginsResponse.status()}`);
    }
    const pluginsBody = await pluginsResponse.json();
    const pluginMap: Record<string, string> = {};
    for (const plugin of pluginsBody.data || []) {
      pluginMap[plugin.id] = plugin.packageName;
    }

    console.log("Plugin map: \n" + JSON.stringify(pluginMap, null, 2));

    const dsListResponse = await api.get(
      `${baseURL}${API.datasources}?workspaceId=${workspace.id}`,
    );
    if (!dsListResponse.ok()) {
      throw new Error(`Failed to list datasources: ${dsListResponse.status()}`);
    }
    const dsList = await dsListResponse.json();
    const datasources = dsList.data || [];

    for (const ds of datasources) {
      const packageName = pluginMap[ds.pluginId];
      const dsConfig = DS_CONFIGS[packageName];
      if (!dsConfig) {
        console.log(
          `Skipping DS "${ds.name}" (plugin: ${packageName}) — no reconnect config`,
        );
        continue;
      }

      const storages: Record<
        string,
        Record<string, unknown>
      > = ds.datasourceStorages || {};
      for (const [envId, storage] of Object.entries(storages)) {
        const updateResponse = await api.put(
          `${baseURL}${API.datasourceStorages}`,
          {
            data: {
              id: storage.id,
              datasourceId: ds.id,
              environmentId: envId,
              datasourceConfiguration: dsConfig,
              isConfigured: true,
            },
          },
        );
        if (!updateResponse.ok()) {
          const body = await updateResponse.text();
          throw new Error(
            `Failed to reconnect DS "${ds.name}" (${packageName}): ${updateResponse.status()} ${body}`,
          );
        }
        console.log(
          `Reconnected DS "${ds.name}" (${packageName}) env=${envId}`,
        );
      }
    }
  });

  const pages: Record<string, MigrationPage> = {};
  await setup.step("fetch page slugs", async () => {
    const pagesResponse = await api.get(
      `${baseURL}${API.pages}/application/${appId}`,
    );
    if (!pagesResponse.ok()) {
      throw new Error(
        `Failed to fetch pages: ${pagesResponse.status()} ${await pagesResponse.text()}`,
      );
    }
    const pagesBody = await pagesResponse.json();
    const pagesList = pagesBody.data?.pages || [];
    console.log(
      `Fetched ${pagesList.length} pages from /pages/application/${appId}`,
    );
    for (const p of pagesList) {
      console.log(`  page: slug=${p.slug}, id=${p.id}, baseId=${p.baseId}`);
      if (!p.slug) {
        console.warn("Page missing slug:", JSON.stringify(p));
        continue;
      }
      pages[p.slug] = {
        id: p.id,
        baseId: p.baseId || p.id,
        slug: p.slug,
      };
    }
    console.log("Mapped page keys:", Object.keys(pages));
  });

  const state: MigrationState = {
    workspaceId: workspace.id,
    workspaceName: workspace.name,
    appId,
    appSlug,
    branchName,
    deployKeyId: importResult.deployKeyId,
    repoName: REPO_NAME,
    pages,
    importedAppData: appData,
  };

  console.log("Migration state:\n" + JSON.stringify(state, null, 2));

  fs.mkdirSync(STATE_DIR, { recursive: true });
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
});

setup.afterAll(async () => {
  // Cleanup is intentionally deferred — tests read .state/migration.json.
  // After all regression/git tests finish, a teardown project can clean up.
  // For now, workspace persists for the duration of the test run.
});
