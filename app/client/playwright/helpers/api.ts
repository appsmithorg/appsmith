import type { APIRequestContext } from "@playwright/test";
import { API } from "../constants/api-routes";

export interface WorkspaceInfo {
  id: string;
  name: string;
}

export interface AppInfo {
  id: string;
  name: string;
  slug: string;
  url: string;
}

export async function createWorkspace(
  api: APIRequestContext,
  name: string,
): Promise<WorkspaceInfo> {
  const response = await api.post(API.workspaces, { data: { name } });

  if (!response.ok()) {
    throw new Error(
      `Failed to create workspace "${name}": ${response.status()} ${await response.text()}`,
    );
  }

  const body = await response.json();
  return {
    id: body.data.id,
    name: body.data.name,
  };
}

export async function deleteWorkspace(
  api: APIRequestContext,
  workspaceId: string,
): Promise<void> {
  const response = await api.delete(`${API.workspaces}/${workspaceId}`);

  if (!response.ok()) {
    throw new Error(
      `Failed to delete workspace "${workspaceId}": ${response.status()}`,
    );
  }
}

export async function createApp(
  api: APIRequestContext,
  workspaceId: string,
  name: string,
): Promise<AppInfo> {
  const response = await api.post(API.applications, {
    data: { name, workspaceId },
  });

  if (!response.ok()) {
    throw new Error(
      `Failed to create app "${name}": ${response.status()} ${await response.text()}`,
    );
  }

  const body = await response.json();
  const app = body.data;

  return {
    id: app.id,
    name: app.name,
    slug: app.slug,
    url: `/app/${app.slug}/${app.id}`,
  };
}

export async function deleteApp(
  api: APIRequestContext,
  appId: string,
): Promise<void> {
  const response = await api.delete(`${API.applications}/${appId}`);

  if (!response.ok()) {
    throw new Error(`Failed to delete app "${appId}": ${response.status()}`);
  }
}

export async function deleteGitDeployKey(
  api: APIRequestContext,
  repoName: string,
  keyId: string,
): Promise<void> {
  const response = await api.delete(`${API.gitDeployKey}/${repoName}/${keyId}`);

  if (!response.ok()) {
    throw new Error(
      `Failed to delete deploy key "${keyId}": ${response.status()}`,
    );
  }
}
