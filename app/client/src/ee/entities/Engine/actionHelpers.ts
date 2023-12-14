export * from "ce/entities/Engine/actionHelpers";
import { fetchConsumablePackagesInWorkspace } from "@appsmith/actions/packageActions";
import {
  ReduxActionErrorTypes,
  ReduxActionTypes,
} from "@appsmith/constants/ReduxActionConstants";
import type { DependentFeatureFlags } from "@appsmith/selectors/engineSelectors";
import {
  ACTION_PARENT_ENTITY_TYPE as CE_ACTION_PARENT_ENTITY_TYPE,
  getPageDependencyActions as CE_getPageDependencyActions,
} from "ce/entities/Engine/actionHelpers";

enum EE_ACTION_PARENT_ENTITY_TYPE {
  WORKFLOW = "WORKFLOW",
}

export const ACTION_PARENT_ENTITY_TYPE = {
  ...CE_ACTION_PARENT_ENTITY_TYPE,
  ...EE_ACTION_PARENT_ENTITY_TYPE,
};

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
