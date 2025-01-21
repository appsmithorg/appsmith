import type { APP_MODE } from "entities/App";

// Redux action to show the environment info modal before deploy
export const showEnvironmentDeployInfoModal = () => ({});

// Redux action to update the current editing environment ID
export const setCurrentEditingEnvironmentID = (currentEditingId: string) => ({
  type: "",
  payload: { currentEditingId },
});

// Redux action to fetch environments
export const fetchingEnvironmentConfigs = ({
  editorId,
  fetchDatasourceMeta = false,
  mode,
  workspaceId,
}: {
  editorId: string;
  fetchDatasourceMeta: boolean;
  workspaceId: string;
  mode?: APP_MODE;
}) => ({
  type: "",
  payload: { workspaceId, editorId, fetchDatasourceMeta, mode },
});
