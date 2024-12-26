export enum GitArtifactType {
  Application = "Application",
  Package = "Package",
  Workflow = "Workflow",
}

export enum GitOpsTab {
  Deploy = "Deploy",
  Merge = "Merge",
}

export enum GitSettingsTab {
  General = "General",
  Branch = "Branch",
  ContinuousDelivery = "ContinuousDelivery",
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
  REPO_NOT_EMPTY = "AE-GIT-4033",
  REPO_LIMIT_REACHED = "AE-GIT-4043",
  PUSH_FAILED_REMOTE_COUNTERPART_IS_AHEAD = "AE-GIT-4048",
}
