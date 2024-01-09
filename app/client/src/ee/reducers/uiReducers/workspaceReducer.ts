export * from "ce/reducers/uiReducers/workspaceReducer";
import type { ReduxAction } from "@appsmith/constants/ReduxActionConstants";
import {
  ReduxActionErrorTypes,
  ReduxActionTypes,
} from "@appsmith/constants/ReduxActionConstants";
import {
  handlers as CE_handlers,
  initialState as CE_initialState,
} from "ce/reducers/uiReducers/workspaceReducer";
import type { WorkspaceReduxState as CE_WorkspaceReduxState } from "ce/reducers/uiReducers/workspaceReducer";
import { createImmerReducer } from "utils/ReducerUtils";
import type {
  PackageMetadata,
  Package,
} from "@appsmith/constants/PackageConstants";
import type {
  CreatePackageFromWorkspacePayload,
  DeletePackagePayload,
} from "@appsmith/actions/packageActions";
import type {
  Workflow,
  WorkflowMetadata,
} from "@appsmith/constants/WorkflowConstants";
import type { DeleteWorkflowPayload } from "@appsmith/actions/workflowActions";

export const initialState: WorkspaceReduxState = {
  ...CE_initialState,
  groupSuggestions: [],

  loadingStates: {
    ...CE_initialState.loadingStates,
    isFetchingPackagesList: false,
    isFetchingWorkflowsList: false,
    packageCreationRequestMap: {},
    workflowCreationRequestMap: {},
  },
  packagesList: [],
  workflowsList: [],
  isSavingPkgName: false,
  isSavingWorkflowName: false,
  isErrorSavingPkgName: false,
  isErrorSavingWorkflowName: false,
};

type ID = string;

type LoadingStates = CE_WorkspaceReduxState["loadingStates"] & {
  isFetchingPackagesList: boolean;
  isFetchingWorkflowsList: boolean;
  packageCreationRequestMap: Record<ID, boolean>;
  workflowCreationRequestMap: Record<ID, boolean>;
};

type FilteredCE_WorkspaceRedux = Omit<CE_WorkspaceReduxState, "loadingStates">;

export interface GroupSuggestions {
  id: string;
  name: string;
}
export interface WorkspaceReduxState extends FilteredCE_WorkspaceRedux {
  groupSuggestions: GroupSuggestions[];
  loadingStates: LoadingStates;
  packagesList: PackageMetadata[];
  workflowsList: WorkflowMetadata[];
  isSavingPkgName: boolean;
  isSavingWorkflowName: boolean;
  isErrorSavingPkgName: boolean;
  isErrorSavingWorkflowName: boolean;
}

const handlers = {
  ...CE_handlers,
  [ReduxActionTypes.FETCH_GROUP_SUGGESTIONS_SUCCESS]: (
    draftState: WorkspaceReduxState,
    action: ReduxAction<any>,
  ) => {
    draftState.groupSuggestions = action.payload;
  },
  [ReduxActionErrorTypes.FETCH_GROUP_SUGGESTIONS_ERROR]: (
    draftState: WorkspaceReduxState,
  ) => {
    draftState.groupSuggestions = [];
  },
  [ReduxActionTypes.FETCH_ALL_PACKAGES_INIT]: (
    draftState: WorkspaceReduxState,
  ) => {
    draftState.loadingStates.isFetchingPackagesList = true;

    return draftState;
  },
  [ReduxActionErrorTypes.FETCH_ALL_PACKAGES_ERROR]: (
    draftState: WorkspaceReduxState,
  ) => {
    draftState.loadingStates.isFetchingPackagesList = false;

    return draftState;
  },
  [ReduxActionTypes.FETCH_ALL_PACKAGES_SUCCESS]: (
    draftState: WorkspaceReduxState,
    action: ReduxAction<PackageMetadata[]>,
  ) => {
    draftState.loadingStates.isFetchingPackagesList = false;

    draftState.packagesList = action.payload || [];

    return draftState;
  },
  [ReduxActionTypes.CREATE_PACKAGE_FROM_WORKSPACE_INIT]: (
    draftState: WorkspaceReduxState,
    action: ReduxAction<CreatePackageFromWorkspacePayload>,
  ) => {
    const { workspaceId } = action.payload;
    draftState.loadingStates.packageCreationRequestMap[workspaceId] = true;

    return draftState;
  },
  [ReduxActionTypes.CREATE_PACKAGE_FROM_WORKSPACE_SUCCESS]: (
    draftState: WorkspaceReduxState,
    action: ReduxAction<Package>,
  ) => {
    const { workspaceId } = action.payload;
    draftState.loadingStates.packageCreationRequestMap[workspaceId] = false;

    return draftState;
  },
  [ReduxActionErrorTypes.CREATE_PACKAGE_FROM_WORKSPACE_ERROR]: (
    draftState: WorkspaceReduxState,
    action: ReduxAction<{ workspaceId: string }>,
  ) => {
    const { workspaceId } = action.payload;
    draftState.loadingStates.packageCreationRequestMap[workspaceId] = false;

    return draftState;
  },
  [ReduxActionTypes.DELETE_PACKAGE_SUCCESS]: (
    draftState: WorkspaceReduxState,
    action: ReduxAction<DeletePackagePayload>,
  ) => {
    const { id } = action.payload;
    const index = draftState.packagesList.findIndex((p) => p.id === id);
    if (index !== -1) draftState.packagesList.splice(index, 1);

    return draftState;
  },
  [ReduxActionTypes.UPDATE_PACKAGE_INIT]: (draftState: WorkspaceReduxState) => {
    return {
      ...draftState,
      isSavingPkgName: true,
      isErrorSavingPkgName: false,
    };
  },
  [ReduxActionTypes.UPDATE_PACKAGE_SUCCESS]: (
    draftState: WorkspaceReduxState,
    action: ReduxAction<Package>,
  ) => {
    const pkg = action.payload;
    const index = draftState.packagesList.findIndex((p) => p.id === pkg.id);
    if (index !== -1) draftState.packagesList[index] = pkg;
    draftState.isSavingPkgName = false;
    draftState.isErrorSavingPkgName = false;

    return draftState;
  },
  [ReduxActionErrorTypes.UPDATE_PACKAGE_ERROR]: (
    draftState: WorkspaceReduxState,
  ) => {
    return {
      ...draftState,
      isSavingPkgName: false,
      isErrorSavingPkgName: true,
    };
  },
  [ReduxActionTypes.CREATE_WORKFLOW_FROM_WORKSPACE_INIT]: (
    draftState: WorkspaceReduxState,
    action: ReduxAction<CreatePackageFromWorkspacePayload>,
  ) => {
    const { workspaceId } = action.payload;
    draftState.loadingStates.workflowCreationRequestMap[workspaceId] = true;

    return draftState;
  },
  [ReduxActionTypes.CREATE_WORKFLOW_FROM_WORKSPACE_SUCCESS]: (
    draftState: WorkspaceReduxState,
    action: ReduxAction<Package>,
  ) => {
    const { workspaceId } = action.payload;
    draftState.loadingStates.workflowCreationRequestMap[workspaceId] = false;

    return draftState;
  },
  [ReduxActionErrorTypes.CREATE_WORKFLOW_FROM_WORKSPACE_ERROR]: (
    draftState: WorkspaceReduxState,
    action: ReduxAction<{ workspaceId: string }>,
  ) => {
    const { workspaceId } = action.payload;
    draftState.loadingStates.workflowCreationRequestMap[workspaceId] = false;

    return draftState;
  },
  [ReduxActionTypes.FETCH_ALL_WORKFLOWS_INIT]: (
    draftState: WorkspaceReduxState,
  ) => {
    draftState.loadingStates.isFetchingWorkflowsList = true;

    return draftState;
  },
  [ReduxActionErrorTypes.FETCH_ALL_WORKFLOWS_ERROR]: (
    draftState: WorkspaceReduxState,
  ) => {
    draftState.loadingStates.isFetchingWorkflowsList = false;

    return draftState;
  },
  [ReduxActionTypes.FETCH_ALL_WORKFLOWS_SUCCESS]: (
    draftState: WorkspaceReduxState,
    action: ReduxAction<WorkflowMetadata[]>,
  ) => {
    draftState.loadingStates.isFetchingWorkflowsList = false;

    draftState.workflowsList = action.payload || [];

    return draftState;
  },
  [ReduxActionTypes.DELETE_WORKFLOW_SUCCESS]: (
    draftState: WorkspaceReduxState,
    action: ReduxAction<DeleteWorkflowPayload>,
  ) => {
    const { id } = action.payload;
    const index = draftState.workflowsList.findIndex((p) => p.id === id);
    if (index !== -1) draftState.workflowsList.splice(index, 1);

    return draftState;
  },
  [ReduxActionTypes.UPDATE_WORKFLOW_NAME_SUCCESS]: (
    draftState: WorkspaceReduxState,
    action: ReduxAction<Workflow>,
  ) => {
    const workflow = action.payload;
    const index = draftState.workflowsList.findIndex(
      (w) => w.id === workflow.id,
    );
    if (index !== -1) draftState.workflowsList[index] = workflow;
    draftState.isSavingWorkflowName = false;
    draftState.isErrorSavingWorkflowName = false;

    return draftState;
  },
  [ReduxActionErrorTypes.UPDATE_WORKFLOW_NAME_ERROR]: (
    draftState: WorkspaceReduxState,
  ) => {
    return {
      ...draftState,
      isSavingWorkflowName: false,
      isErrorSavingWorkflowName: true,
    };
  },
};

const workspaceReducer = createImmerReducer(initialState, handlers);

export default workspaceReducer;
