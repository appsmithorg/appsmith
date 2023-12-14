export * from "ce/selectors/workflowSelectors";
import type { AppState } from "@appsmith/reducers";
import { selectFeatureFlags } from "@appsmith/selectors/featureFlagsSelectors";
import { getAppsmithConfigs } from "@appsmith/configs";

import { createSelector } from "reselect";
import type { ActionDataState } from "@appsmith/reducers/entityReducers/actionsReducer";

export const getIsFetchingWorkflows = (state: AppState) =>
  state.ui.workspaces.loadingStates.isFetchingWorkflowsList;

export const getIsCreatingWorkflow = (state: AppState, workspaceId: string) =>
  state.ui.workspaces.loadingStates.workflowCreationRequestMap[workspaceId];

export const getWorkflowById = (state: AppState, workflowId: string) =>
  state.entities.workflows[workflowId];

export const getWorkflowsList = (state: AppState) =>
  state.ui.workspaces.workflowsList;

export const getCurrentWorkflowId = (state: AppState) =>
  state.ui.editor?.currentWorkflowId;

export const getWorkflows = (state: AppState) => state.entities.workflows;

export const getCurrentWorkflow = createSelector(
  getCurrentWorkflowId,
  getWorkflows,
  (currentWorkflowId, workflows) =>
    currentWorkflowId ? workflows[currentWorkflowId] : null,
);
export const getCurrentWorkflowName = createSelector(
  getCurrentWorkflowId,
  getWorkflows,
  (currentWorkflowId, workflows) =>
    currentWorkflowId ? workflows[currentWorkflowId].name : "",
);

export const getIsWorkflowEditorInitialized = (state: AppState) =>
  state.ui.editor.isWorkflowEditorInitialized;

export const getIsSavingWorkflowName = (state: AppState) =>
  state.ui.workspaces.isSavingWorkflowName;

export const getisErrorSavingWorkflowName = (state: AppState) =>
  state.ui.workspaces.isErrorSavingWorkflowName;

/**
 * Checks if the release_workflows_enabled feature flag is enabled and if the
 * current instance is cloud hosted. This is the base condition for enabling
 * workflows.
 *
 * @returns boolean
 */
export const getShowWorkflowFeature = createSelector(
  selectFeatureFlags,
  (featureFlags) => {
    const { cloudHosting } = getAppsmithConfigs();

    return !cloudHosting && featureFlags.release_workflows_enabled;
  },
);

export const getIsCurrentEditorWorkflowType = createSelector(
  getCurrentWorkflowId,
  (currentWorkflowId) => !!currentWorkflowId,
);

// TODO: Remove this selector and use the one from selectors/workflowSelectors.ts instead
// Did this to avoid error due to cyclic dependency
const getActions = (state: AppState): ActionDataState => state.entities.actions;

export const getCurrentWorkflowActions = createSelector(
  getCurrentWorkflowId,
  getActions,
  (workflowId, actions) => {
    if (!actions || actions.length === 0) return [];
    if (!workflowId) return [];
    return actions.filter((a) => a.config.workflowId === workflowId);
  },
);
