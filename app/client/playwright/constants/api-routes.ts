export const API = {
  workspaces: "/api/v1/workspaces",
  applications: "/api/v1/applications",
  applicationsPublish: "/api/v1/applications/publish",
  datasources: "/api/v1/datasources",
  gitCommit: "/api/v1/git/commit",
  gitImport: "/api/v1/git/artifacts/import",
  gitImportKeys: "/api/v1/git/artifacts/import/keys",
  gitStatus: "/api/v1/git/status",
  gitDeployKey: "/api/v1/git/deploy-key",
  actionsExecute: "/api/v1/actions/execute",
  users: "/api/v1/users",
  login: "/api/v1/login",
} as const;
