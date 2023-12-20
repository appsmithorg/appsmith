import { klona } from "klona";

import type { WorkspaceReduxState } from "@appsmith/reducers/uiReducers/workspaceReducer";
import reducer from "@appsmith/reducers/uiReducers/workspaceReducer";
import {
  ReduxActionTypes,
  ReduxActionErrorTypes,
} from "@appsmith/constants/ReduxActionConstants";
import type { Workflow } from "@appsmith/constants/WorkflowConstants";

const package1 = {
  id: "pkg-1",
  name: "Package 1",
};

const package2 = {
  id: "pkg-2",
  name: "Package 2",
};

const workflow1: Workflow = {
  id: "1",
  name: "Workflow 1",
  icon: "",
  color: "",
  workspaceId: "",
  modifiedBy: "",
  modifiedAt: "",
  userPermissions: [],
  new: false,
  slug: "",
  mainJsObjectId: "",
  tokenGenerated: false,
};

const workflow2: Workflow = {
  ...workflow1,
  id: "2",
  name: "Workflow 2",
};

const DEFAULT_STATE: WorkspaceReduxState = {
  loadingStates: {
    isFetchAllRoles: false,
    isFetchAllUsers: false,
    isFetchingWorkspaces: false,
    isFetchingPackagesList: false,
    isFetchingCurrentWorkspace: false,
    isSavingWorkspaceInfo: false,
    isFetchingWorkflowsList: false,
    packageCreationRequestMap: {},
    workflowCreationRequestMap: {},
  },
  list: [],
  workspaceUsers: [],
  workspaceRoles: [],
  currentWorkspace: {
    id: "",
    name: "",
  },
  packagesList: [],
  workflowsList: [],
  groupSuggestions: [],
  isSavingPkgName: false,
  isSavingWorkflowName: false,
  isErrorSavingPkgName: false,
  isErrorSavingWorkflowName: false,
};

describe("workspaceReducer", () => {
  it("FETCH_ALL_PACKAGES_INIT - should set isFetchingPackagesList to true", () => {
    const initialState = DEFAULT_STATE;

    const expectedState = klona(DEFAULT_STATE);
    expectedState.loadingStates.isFetchingPackagesList = true;

    expect(
      reducer(initialState, {
        type: ReduxActionTypes.FETCH_ALL_PACKAGES_INIT,
        payload: undefined,
      }),
    ).toEqual(expectedState);
  });

  it("FETCH_ALL_PACKAGES_ERROR - should set isFetchingPackagesList to false", () => {
    const initialState = klona(DEFAULT_STATE);
    initialState.loadingStates.isFetchingPackagesList = true;

    const expectedState = DEFAULT_STATE;

    expect(
      reducer(initialState, {
        type: ReduxActionErrorTypes.FETCH_ALL_PACKAGES_ERROR,
        payload: undefined,
      }),
    ).toEqual(expectedState);
  });

  it("FETCH_ALL_PACKAGES_SUCCESS - should set isFetchingPackagesList to false and sets the payload", () => {
    const initialState = klona(DEFAULT_STATE);
    initialState.loadingStates.isFetchingPackagesList = true;

    const payload = [{ name: "test" }];

    const expectedState = klona(DEFAULT_STATE);
    expectedState.packagesList = payload as any;
    expectedState.loadingStates.isFetchingPackagesList = false;

    expect(
      reducer(initialState, {
        type: ReduxActionTypes.FETCH_ALL_PACKAGES_SUCCESS,
        payload,
      }),
    ).toEqual(expectedState);
  });

  it("CREATE_PACKAGE_FROM_WORKSPACE_INIT - sets true for the workspaceId", () => {
    const workspaceId = "test-workspace-1";

    const initialState = DEFAULT_STATE;
    const expectedState = klona(DEFAULT_STATE);

    expectedState.loadingStates.packageCreationRequestMap[workspaceId] = true;

    expect(
      reducer(initialState, {
        type: ReduxActionTypes.CREATE_PACKAGE_FROM_WORKSPACE_INIT,
        payload: {
          workspaceId,
        },
      }),
    ).toEqual(expectedState);
  });

  it("CREATE_PACKAGE_FROM_WORKSPACE_INIT - does not modify other workspace status", () => {
    const workspaceId1 = "test-workspace-1";
    const workspaceId2 = "test-workspace-2";

    const initialState = klona(DEFAULT_STATE);
    const expectedState = klona(DEFAULT_STATE);

    initialState.loadingStates.packageCreationRequestMap[workspaceId1] = false;
    expectedState.loadingStates.packageCreationRequestMap[workspaceId1] = false;
    expectedState.loadingStates.packageCreationRequestMap[workspaceId2] = true;

    expect(
      reducer(initialState, {
        type: ReduxActionTypes.CREATE_PACKAGE_FROM_WORKSPACE_INIT,
        payload: {
          workspaceId: workspaceId2,
        },
      }),
    ).toEqual(expectedState);
  });

  it("CREATE_PACKAGE_FROM_WORKSPACE_SUCCESS - sets false for the workspaceId", () => {
    const workspaceId = "test-workspace-1";

    const initialState = klona(DEFAULT_STATE);
    const expectedState = klona(DEFAULT_STATE);

    initialState.loadingStates.packageCreationRequestMap[workspaceId] = true;
    expectedState.loadingStates.packageCreationRequestMap[workspaceId] = false;

    expect(
      reducer(initialState, {
        type: ReduxActionTypes.CREATE_PACKAGE_FROM_WORKSPACE_SUCCESS,
        payload: {
          workspaceId,
        },
      }),
    ).toEqual(expectedState);
  });

  it("CREATE_PACKAGE_FROM_WORKSPACE_SUCCESS - does not modify other workspace status", () => {
    const workspaceId1 = "test-workspace-1";
    const workspaceId2 = "test-workspace-2";

    const initialState = klona(DEFAULT_STATE);
    const expectedState = klona(DEFAULT_STATE);

    initialState.loadingStates.packageCreationRequestMap[workspaceId1] = true;
    expectedState.loadingStates.packageCreationRequestMap[workspaceId1] = true;
    expectedState.loadingStates.packageCreationRequestMap[workspaceId2] = false;

    expect(
      reducer(initialState, {
        type: ReduxActionTypes.CREATE_PACKAGE_FROM_WORKSPACE_SUCCESS,
        payload: {
          workspaceId: workspaceId2,
        },
      }),
    ).toEqual(expectedState);
  });

  it("CREATE_PACKAGE_FROM_WORKSPACE_ERROR - sets false for the workspaceId", () => {
    const workspaceId = "test-workspace-1";

    const initialState = klona(DEFAULT_STATE);
    const expectedState = klona(DEFAULT_STATE);

    initialState.loadingStates.packageCreationRequestMap[workspaceId] = true;
    expectedState.loadingStates.packageCreationRequestMap[workspaceId] = false;

    expect(
      reducer(initialState, {
        type: ReduxActionErrorTypes.CREATE_PACKAGE_FROM_WORKSPACE_ERROR,
        payload: {
          workspaceId,
        },
      }),
    ).toEqual(expectedState);
  });

  it("CREATE_PACKAGE_FROM_WORKSPACE_ERROR - does not modify other workspace status", () => {
    const workspaceId1 = "test-workspace-1";
    const workspaceId2 = "test-workspace-2";

    const initialState = klona(DEFAULT_STATE);
    const expectedState = klona(DEFAULT_STATE);

    initialState.loadingStates.packageCreationRequestMap[workspaceId1] = true;
    expectedState.loadingStates.packageCreationRequestMap[workspaceId1] = true;
    expectedState.loadingStates.packageCreationRequestMap[workspaceId2] = false;

    expect(
      reducer(initialState, {
        type: ReduxActionErrorTypes.CREATE_PACKAGE_FROM_WORKSPACE_ERROR,
        payload: {
          workspaceId: workspaceId2,
        },
      }),
    ).toEqual(expectedState);
  });

  it("DELETE_PACKAGE_SUCCESS - should delete the respective package from the package list", () => {
    const payload = [package1, package2];
    const initialState = klona(DEFAULT_STATE);
    initialState.packagesList = payload as any;

    const expectedState = klona(DEFAULT_STATE);
    expectedState.packagesList = [package1] as any;

    expect(
      reducer(initialState, {
        type: ReduxActionTypes.DELETE_PACKAGE_SUCCESS,
        payload: {
          id: "pkg-2",
        },
      }),
    ).toEqual(expectedState);
  });

  it("UPDATE_PACKAGE_SUCCESS - should update the color and name of the respective package from the package list", () => {
    const payload = [package1, package2];
    const updatedPkg = {
      ...package2,
      color: "#000",
      name: "test2 updated",
    };
    const initialState = klona(DEFAULT_STATE);
    initialState.packagesList = payload as any;

    const expectedState = klona(DEFAULT_STATE);
    expectedState.packagesList = [package1, updatedPkg] as any;

    expect(
      reducer(initialState, {
        type: ReduxActionTypes.UPDATE_PACKAGE_SUCCESS,
        payload: updatedPkg,
      }),
    ).toEqual(expectedState);
  });

  it("FETCH_ALL_WORKFLOWS_INIT - should set isFetchingWorkflowsList to true", () => {
    const initialState = DEFAULT_STATE;

    const expectedState = klona(DEFAULT_STATE);
    expectedState.loadingStates.isFetchingWorkflowsList = true;

    expect(
      reducer(initialState, {
        type: ReduxActionTypes.FETCH_ALL_WORKFLOWS_INIT,
        payload: undefined,
      }),
    ).toEqual(expectedState);
  });

  it("FETCH_ALL_WORKFLOWS_ERROR - should set isFetchingWorkflowsList to false", () => {
    const initialState = klona(DEFAULT_STATE);
    initialState.loadingStates.isFetchingWorkflowsList = true;

    const expectedState = DEFAULT_STATE;

    expect(
      reducer(initialState, {
        type: ReduxActionErrorTypes.FETCH_ALL_WORKFLOWS_ERROR,
        payload: undefined,
      }),
    ).toEqual(expectedState);
  });

  it("FETCH_ALL_WORKFLOWS_SUCCESS - should set isFetchingWorkflowsList to false and sets the payload", () => {
    const initialState = klona(DEFAULT_STATE);
    initialState.loadingStates.isFetchingWorkflowsList = true;

    const payload = [{ name: "test" }];

    const expectedState = klona(DEFAULT_STATE);
    expectedState.workflowsList = payload as any;
    expectedState.loadingStates.isFetchingWorkflowsList = false;

    expect(
      reducer(initialState, {
        type: ReduxActionTypes.FETCH_ALL_WORKFLOWS_SUCCESS,
        payload,
      }),
    ).toEqual(expectedState);
  });

  it("CREATE_WORKFLOW_FROM_WORKSPACE_INIT - sets true for the workspaceId", () => {
    const workspaceId = "test-workspace-1";

    const initialState = DEFAULT_STATE;
    const expectedState = klona(DEFAULT_STATE);

    expectedState.loadingStates.workflowCreationRequestMap[workspaceId] = true;

    expect(
      reducer(initialState, {
        type: ReduxActionTypes.CREATE_WORKFLOW_FROM_WORKSPACE_INIT,
        payload: {
          workspaceId,
        },
      }),
    ).toEqual(expectedState);
  });

  it("CREATE_WORKFLOW_FROM_WORKSPACE_INIT - does not modify other workspace status", () => {
    const workspaceId1 = "test-workspace-1";
    const workspaceId2 = "test-workspace-2";

    const initialState = klona(DEFAULT_STATE);
    const expectedState = klona(DEFAULT_STATE);

    initialState.loadingStates.workflowCreationRequestMap[workspaceId1] = false;
    expectedState.loadingStates.workflowCreationRequestMap[workspaceId1] =
      false;
    expectedState.loadingStates.workflowCreationRequestMap[workspaceId2] = true;

    expect(
      reducer(initialState, {
        type: ReduxActionTypes.CREATE_WORKFLOW_FROM_WORKSPACE_INIT,
        payload: {
          workspaceId: workspaceId2,
        },
      }),
    ).toEqual(expectedState);
  });

  it("CREATE_WORKFLOW_FROM_WORKSPACE_SUCCESS - sets false for the workspaceId", () => {
    const workspaceId = "test-workspace-1";

    const initialState = klona(DEFAULT_STATE);
    const expectedState = klona(DEFAULT_STATE);

    initialState.loadingStates.workflowCreationRequestMap[workspaceId] = true;
    expectedState.loadingStates.workflowCreationRequestMap[workspaceId] = false;

    expect(
      reducer(initialState, {
        type: ReduxActionTypes.CREATE_WORKFLOW_FROM_WORKSPACE_SUCCESS,
        payload: {
          workspaceId,
        },
      }),
    ).toEqual(expectedState);
  });

  it("CREATE_WORKFLOW_FROM_WORKSPACE_SUCCESS - does not modify other workspace status", () => {
    const workspaceId1 = "test-workspace-1";
    const workspaceId2 = "test-workspace-2";

    const initialState = klona(DEFAULT_STATE);
    const expectedState = klona(DEFAULT_STATE);

    initialState.loadingStates.workflowCreationRequestMap[workspaceId1] = true;
    expectedState.loadingStates.workflowCreationRequestMap[workspaceId1] = true;
    expectedState.loadingStates.workflowCreationRequestMap[workspaceId2] =
      false;

    expect(
      reducer(initialState, {
        type: ReduxActionTypes.CREATE_WORKFLOW_FROM_WORKSPACE_SUCCESS,
        payload: {
          workspaceId: workspaceId2,
        },
      }),
    ).toEqual(expectedState);
  });

  it("CREATE_WORKFLOW_FROM_WORKSPACE_ERROR - sets false for the workspaceId", () => {
    const workspaceId = "test-workspace-1";

    const initialState = klona(DEFAULT_STATE);
    const expectedState = klona(DEFAULT_STATE);

    initialState.loadingStates.workflowCreationRequestMap[workspaceId] = true;
    expectedState.loadingStates.workflowCreationRequestMap[workspaceId] = false;

    expect(
      reducer(initialState, {
        type: ReduxActionErrorTypes.CREATE_WORKFLOW_FROM_WORKSPACE_ERROR,
        payload: {
          workspaceId,
        },
      }),
    ).toEqual(expectedState);
  });

  it("CREATE_WORKFLOW_FROM_WORKSPACE_ERROR - does not modify other workspace status", () => {
    const workspaceId1 = "test-workspace-1";
    const workspaceId2 = "test-workspace-2";

    const initialState = klona(DEFAULT_STATE);
    const expectedState = klona(DEFAULT_STATE);

    initialState.loadingStates.workflowCreationRequestMap[workspaceId1] = true;
    expectedState.loadingStates.workflowCreationRequestMap[workspaceId1] = true;
    expectedState.loadingStates.workflowCreationRequestMap[workspaceId2] =
      false;

    expect(
      reducer(initialState, {
        type: ReduxActionErrorTypes.CREATE_WORKFLOW_FROM_WORKSPACE_ERROR,
        payload: {
          workspaceId: workspaceId2,
        },
      }),
    ).toEqual(expectedState);
  });

  it("DELETE_WORKFLOW_SUCCESS - should delete the respective workflow from the workflow list", () => {
    const payload = [workflow1, workflow2];
    const initialState = klona(DEFAULT_STATE);
    initialState.workflowsList = payload as any;

    const expectedState = klona(DEFAULT_STATE);
    expectedState.workflowsList = [workflow1] as any;

    expect(
      reducer(initialState, {
        type: ReduxActionTypes.DELETE_WORKFLOW_SUCCESS,
        payload: {
          id: "2",
        },
      }),
    ).toEqual(expectedState);
  });

  it("UPDATE_WORKFLOW_NAME_SUCCESS - should update the color and name of the respective workflow from the workflow list", () => {
    const payload = [workflow1, workflow2];
    const updatedWorkflow = {
      ...workflow2,
      color: "#000",
      name: "test2 updated",
    };
    const initialState = klona(DEFAULT_STATE);
    initialState.workflowsList = payload as any;

    const expectedState = klona(DEFAULT_STATE);
    expectedState.workflowsList = [workflow1, updatedWorkflow] as any;

    expect(
      reducer(initialState, {
        type: ReduxActionTypes.UPDATE_WORKFLOW_NAME_SUCCESS,
        payload: updatedWorkflow,
      }),
    ).toEqual(expectedState);
  });

  it("UPDATE_WORKFLOW_NAME_ERROR - should not update the color and name of the respective workflow from the workflow list", () => {
    const payload = [workflow1, workflow2];
    const updatedWorkflow = {
      ...workflow2,
      color: "#000",
      name: "test2 updated",
    };
    const initialState = klona(DEFAULT_STATE);
    initialState.workflowsList = payload as any;

    const expectedState = klona(DEFAULT_STATE);
    expectedState.workflowsList = [workflow1, workflow2] as any;
    expectedState.isErrorSavingWorkflowName = true;

    expect(
      reducer(initialState, {
        type: ReduxActionErrorTypes.UPDATE_WORKFLOW_NAME_ERROR,
        payload: updatedWorkflow,
      }),
    ).toEqual(expectedState);
  });
});
