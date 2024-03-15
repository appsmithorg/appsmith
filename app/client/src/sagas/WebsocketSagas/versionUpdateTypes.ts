export enum UpdateStateEvent {
  PROMPT_SHOWN = "PROMPT_SHOWN",
  UPDATE_REQUESTED = "UPDATE_REQUESTED",
}

export interface VersionUpdateState {
  currentVersion: string;
  upgradeVersion: string;
  timesShown: number;
  event: UpdateStateEvent;
}
