export * from "ce/entities/Engine/actionHelpers";
import { fetchAllPackagesInWorkspace } from "@appsmith/actions/packageActions";
import {
  ReduxActionErrorTypes,
  ReduxActionTypes,
} from "@appsmith/constants/ReduxActionConstants";
import type { DependentFeatureFlags } from "@appsmith/selectors/engineSelectors";
import { getPageDependencyActions as CE_getPageDependencyActions } from "ce/entities/Engine/actionHelpers";

export const getPageDependencyActions = (
  currentWorkspaceId: string = "",
  featureFlags: DependentFeatureFlags = {},
) => {
  const CE = CE_getPageDependencyActions();
  const initActions = [
    ...CE.initActions,
    ...(featureFlags.showQueryModule
      ? [fetchAllPackagesInWorkspace({ wodrkspaceId: currentWorkspaceId })]
      : []),
  ];

  const successActions = [
    ...CE.successActions,
    ...(featureFlags.showQueryModule
      ? [ReduxActionTypes.FETCH_ALL_PACKAGES_IN_WORKSPACE_SUCCESS]
      : []),
  ];

  const errorActions = [
    ...CE.errorActions,
    ...(featureFlags.showQueryModule
      ? [ReduxActionErrorTypes.FETCH_ALL_PACKAGES_IN_WORKSPACE_ERROR]
      : []),
  ];

  return {
    initActions,
    successActions,
    errorActions,
  };
};
