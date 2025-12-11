import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";

export interface InitWorkspaceDatasourcePayload {
  workspaceId: string;
}

export const initWorkspaceDatasource = (
  payload: InitWorkspaceDatasourcePayload,
) => ({
  type: ReduxActionTypes.INITIALIZE_WORKSPACE_DATASOURCE,
  payload,
});
