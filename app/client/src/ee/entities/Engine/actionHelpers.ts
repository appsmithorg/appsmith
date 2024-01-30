export * from "ce/entities/Engine/actionHelpers";
import { fetchConsumablePackagesInWorkspace } from "@appsmith/actions/packageActions";
import { fetchAllWorkflowsForWorkspace } from "@appsmith/actions/workflowActions";
import {
  ReduxActionErrorTypes,
  ReduxActionTypes,
} from "@appsmith/constants/ReduxActionConstants";
import type { DependentFeatureFlags } from "@appsmith/selectors/engineSelectors";
import {
  getPageDependencyActions as CE_getPageDependencyActions,
  ActionParentEntityType as CE_ActionParentEntityType,
  CreateNewActionKey as CE_CreateNewActionKey,
} from "ce/entities/Engine/actionHelpers";
import type { EditConsolidatedApi } from "sagas/InitSagas";

export const CreateNewActionKey = {
  ...CE_CreateNewActionKey,
  WORKFLOW: "workflowId",
  MODULE: "moduleId",
} as const;

export type CreateNewActionKeyInterface =
  (typeof CreateNewActionKey)[keyof typeof CreateNewActionKey];

export const ActionParentEntityType = {
  ...CE_ActionParentEntityType,
  WORKFLOW: "WORKFLOW",
  MODULE: "MODULE",
} as const;

export type ActionParentEntityTypeInterface =
  (typeof ActionParentEntityType)[keyof typeof ActionParentEntityType];

export const getPageDependencyActions = (
  currentWorkspaceId: string = "",
  featureFlags: DependentFeatureFlags = {},
  allResponses: EditConsolidatedApi,
) => {
  const CE = CE_getPageDependencyActions(
    currentWorkspaceId,
    featureFlags,
    allResponses,
  );
  const initActions = [
    ...CE.initActions,
    ...(featureFlags.showQueryModule
      ? [
          fetchConsumablePackagesInWorkspace({
            workspaceId: currentWorkspaceId,
          }),
        ]
      : []),
    ...(featureFlags.showWorkflowFeature
      ? [fetchAllWorkflowsForWorkspace(currentWorkspaceId)]
      : []),
  ];

  const successActions = [
    ...CE.successActions,
    ...(featureFlags.showQueryModule
      ? [ReduxActionTypes.FETCH_CONSUMABLE_PACKAGES_IN_WORKSPACE_SUCCESS]
      : []),
    ...(featureFlags.showWorkflowFeature
      ? [ReduxActionTypes.FETCH_ALL_WORKFLOWS_FOR_WORKSPACE_SUCCESS]
      : []),
  ];

  const errorActions = [
    ...CE.errorActions,
    ...(featureFlags.showQueryModule
      ? [ReduxActionErrorTypes.FETCH_CONSUMABLE_PACKAGES_IN_WORKSPACE_ERROR]
      : []),
    ...(featureFlags.showWorkflowFeature
      ? [ReduxActionErrorTypes.FETCH_ALL_WORKFLOWS_FOR_WORKSPACE_ERROR]
      : []),
  ];

  return {
    initActions,
    successActions,
    errorActions,
  };
};
