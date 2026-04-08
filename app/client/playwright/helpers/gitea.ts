import type { APIRequestContext } from "@playwright/test";

const GITEA_BASE_URL = process.env.GITEA_BASE_URL || "http://localhost:4200";
const GITEA_API_TOKEN = process.env.GITEA_API_TOKEN || "";

export interface GiteaDeployKey {
  id: number;
  key: string;
  title: string;
}

export async function createGiteaRepo(
  api: APIRequestContext,
  name: string,
  isPrivate = false,
): Promise<void> {
  const response = await api.post(`${GITEA_BASE_URL}/api/v1/git/repos`, {
    data: { name, private: isPrivate },
    headers: giteaHeaders(),
  });

  if (!response.ok()) {
    throw new Error(
      `Failed to create Gitea repo "${name}": ${response.status()} ${await response.text()}`,
    );
  }
}

export async function deleteGiteaRepo(
  api: APIRequestContext,
  name: string,
): Promise<void> {
  const response = await api.delete(
    `${GITEA_BASE_URL}/api/v1/git/repos/${name}`,
    { headers: giteaHeaders() },
  );

  if (!response.ok() && response.status() !== 404) {
    throw new Error(
      `Failed to delete Gitea repo "${name}": ${response.status()}`,
    );
  }
}

export async function addGiteaDeployKey(
  api: APIRequestContext,
  repoName: string,
  publicKey: string,
  title: string,
): Promise<GiteaDeployKey> {
  const response = await api.post(
    `${GITEA_BASE_URL}/api/v1/git/keys/${repoName}`,
    {
      data: { title, key: publicKey, read_only: false },
      headers: giteaHeaders(),
    },
  );

  if (!response.ok()) {
    throw new Error(
      `Failed to add deploy key to "${repoName}": ${response.status()} ${await response.text()}`,
    );
  }

  return response.json();
}

export async function deleteGiteaDeployKey(
  api: APIRequestContext,
  keyId: number,
): Promise<void> {
  const response = await api.delete(
    `${GITEA_BASE_URL}/api/v1/git/keys/${keyId}`,
    { headers: giteaHeaders() },
  );

  if (!response.ok() && response.status() !== 404) {
    throw new Error(
      `Failed to delete deploy key ${keyId}: ${response.status()}`,
    );
  }
}

function giteaHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (GITEA_API_TOKEN) {
    headers["Authorization"] = `token ${GITEA_API_TOKEN}`;
  }

  return headers;
}
