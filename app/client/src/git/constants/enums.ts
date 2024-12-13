export enum GitArtifactType {
  Application = "Application",
  Package = "Package",
  Workflow = "Workflow",
}

export enum GitConnectStep {
  Provider = "Provider",
  Remote = "Remote",
  SSH = "SSH",
}

export enum GitImportStep {
  Provider = "Provider",
  remote = "remote",
  SSH = "SSH",
}

export enum GitOpsTab {
  Deploy = "Deploy",
  Merge = "Merge",
}

export enum GitSettingsTab {
  General = "General",
  Branch = "Branch",
}

export enum AutocommitStatusState {
  IN_PROGRESS = "IN_PROGRESS",
  LOCKED = "LOCKED",
  PUBLISHED = "PUBLISHED",
  IDLE = "IDLE",
  NOT_REQUIRED = "NOT_REQUIRED",
  NON_GIT_APP = "NON_GIT_APP",
}

export enum MergeStatusState {
  FETCHING = "FETCHING",
  MERGEABLE = "MERGEABLE",
  NOT_MERGEABLE = "NOT_MERGEABLE",
  NONE = "NONE",
  ERROR = "ERROR",
}

export enum GitErrorCodes {
  REPO_LIMIT_REACHED = "AE-GIT-4043",
  PUSH_FAILED_REMOTE_COUNTERPART_IS_AHEAD = "AE-GIT-4048",
}
