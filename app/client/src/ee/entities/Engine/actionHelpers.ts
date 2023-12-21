export * from "ce/entities/Engine/actionHelpers";
import { fetchConsumablePackagesInWorkspace } from "@appsmith/actions/packageActions";
import {
  ReduxActionErrorTypes,
  ReduxActionTypes,
} from "@appsmith/constants/ReduxActionConstants";
import type { DependentFeatureFlags } from "@appsmith/selectors/engineSelectors";
import {
  getPageDependencyActions as CE_getPageDependencyActions,
  ACTION_PARENT_ENTITY_TYPE as CE_ACTION_PARENT_ENTITY_TYPE,
  ActionContextType as CE_ActionContextType,
  CreateNewActionKey as CE_CreateNewActionKey,
} from "ce/entities/Engine/actionHelpers";

export const CreateNewActionKey = {
  ...CE_CreateNewActionKey,
  WORKFLOW: "workflowId",
  MODULE: "moduleId",
} as const;

export type CreateNewActionKeyInterface =
  (typeof CreateNewActionKey)[keyof typeof CreateNewActionKey];

export const ActionContextType = {
  ...CE_ActionContextType,
  WORKFLOW: "WORKFLOW",
  MODULE: "MODULE",
} as const;

export type ActionContextTypeInterface =
  (typeof ActionContextType)[keyof typeof ActionContextType];

export const ACTION_PARENT_ENTITY_TYPE = {
  ...CE_ACTION_PARENT_ENTITY_TYPE,
  WORKFLOW: "WORKFLOW",
  PACKAGE: "PACKAGE",
} as const;

export type ActionParentEntityTypeInterface =
  (typeof ACTION_PARENT_ENTITY_TYPE)[keyof typeof ACTION_PARENT_ENTITY_TYPE];

export const getPageDependencyActions = (
  currentWorkspaceId: string = "",
  featureFlags: DependentFeatureFlags = {},
) => {
  const CE = CE_getPageDependencyActions();
  const initActions = [
    ...CE.initActions,
    ...(featureFlags.showQueryModule
      ? [
          fetchConsumablePackagesInWorkspace({
            workspaceId: currentWorkspaceId,
          }),
        ]
      : []),
  ];

  const successActions = [
    ...CE.successActions,
    ...(featureFlags.showQueryModule
      ? [ReduxActionTypes.FETCH_CONSUMABLE_PACKAGES_IN_WORKSPACE_SUCCESS]
      : []),
  ];

  const errorActions = [
    ...CE.errorActions,
    ...(featureFlags.showQueryModule
      ? [ReduxActionErrorTypes.FETCH_CONSUMABLE_PACKAGES_IN_WORKSPACE_ERROR]
      : []),
  ];

  return {
    initActions,
    successActions,
    errorActions,
  };
};
