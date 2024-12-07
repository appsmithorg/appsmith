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

export enum AutocommitStatus {
  IN_PROGRESS = "IN_PROGRESS",
  LOCKED = "LOCKED",
  PUBLISHED = "PUBLISHED",
  IDLE = "IDLE",
  NOT_REQUIRED = "NOT_REQUIRED",
  NON_GIT_APP = "NON_GIT_APP",
}
