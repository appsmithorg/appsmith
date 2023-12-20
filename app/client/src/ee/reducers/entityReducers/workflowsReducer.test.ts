import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import type { WorkflowsReducerState } from "./workflowsReducer";
import workflowReducer from "./workflowsReducer";
import type { Workflow } from "@appsmith/constants/WorkflowConstants";
import { klona } from "klona/lite";

describe("workflowsReducer", () => {
  let initialState: WorkflowsReducerState;

  beforeEach(() => {
    initialState = {};
  });

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

  it("CREATE_WORKFLOW_FROM_WORKSPACE_SUCCESS - should add workflow received in payload", () => {
    // Add workflow2 to initialState
    initialState[workflow2.id] = workflow1;

    const expectedState = klona(initialState);
    expectedState[workflow1.id] = workflow1;
    expectedState[workflow2.id] = workflow2;
    const action = {
      type: ReduxActionTypes.CREATE_WORKFLOW_FROM_WORKSPACE_SUCCESS,
      payload: workflow1,
    };
    const newState = workflowReducer(initialState, action);
    expect(newState[workflow1.id]).toEqual(workflow1);
  });

  it("FETCH_WORKFLOW_SUCCESS - should add the workflow data from payload", () => {
    // Add workflow2 to initialState
    initialState[workflow2.id] = workflow1;

    const action = {
      type: ReduxActionTypes.FETCH_WORKFLOW_SUCCESS,
      payload: { data: workflow1 },
    };
    const newState = workflowReducer(initialState, action);
    expect(newState[workflow1.id]).toEqual(workflow1);
  });

  it("UPDATE_WORKFLOW_NAME_SUCCESS - should update the workflow name", () => {
    // Add workflow2 to initialState
    initialState[workflow2.id] = workflow1;

    initialState[workflow1.id] = workflow1;
    const action = {
      type: ReduxActionTypes.UPDATE_WORKFLOW_NAME_SUCCESS,
      payload: { ...workflow1, name: workflow2.name },
    };
    const newState = workflowReducer(initialState, action);
    expect(newState[workflow1.id]).toEqual({
      ...workflow1,
      name: workflow2.name,
    });
  });
});
