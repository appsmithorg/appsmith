import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";

export interface InitWorkspaceIDEPayload {
  workspaceId: string;
}

export const initWorkspaceIDE = (payload: InitWorkspaceIDEPayload) => ({
  type: ReduxActionTypes.INITIALIZE_WORKSPACE_IDE,
  payload,
});
