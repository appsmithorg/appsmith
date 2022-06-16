import { JSResponseState } from "./JSResponseView";
import { getJSResponseViewState } from "./utils";

const TEST_JS_FUNCTION_ID = "627ccff468e1fa5185b7f901";
const TEST_JS_FUNCTION = {
  id: TEST_JS_FUNCTION_ID,
  applicationId: "627aaf637e9e9b75e43ad2ff",
  workspaceId: "61e52bb4847aa804d79fc7c1",
  pluginType: "JS",
  pluginId: "6138c786168857325f78ef3e",
  name: "myFun234y",
  fullyQualifiedName: "JSObject1.myFun234y",
  datasource: {
    userPermissions: [],
    name: "UNUSED_DATASOURCE",
    pluginId: "6138c786168857325f78ef3e",
    workspaceId: "61e52bb4847aa804d79fc7c1",
    messages: [],
    isValid: true,
    new: true,
  },
  pageId: "627aaf637e9e9b75e43ad302",
  collectionId: "627ccff468e1fa5185b7f904",
  actionConfiguration: {
    timeoutInMillisecond: 10000,
    paginationType: "NONE",
    encodeParamsToggle: true,
    body: "async () => {\n\t\t//use async-await or promises here\n\t\t\n\t}",
    jsArguments: [],
    isAsync: true,
  },
  executeOnLoad: false,
  clientSideExecution: true,
  dynamicBindingPathList: [
    {
      key: "body",
    },
  ],
  isValid: true,
  invalids: [],
  messages: [],
  jsonPathKeys: [
    "async () => {\n\t\t//use async-await or promises here\n\t\t\n\t}",
  ],
  confirmBeforeExecute: false,
  userPermissions: ["read:actions", "execute:actions", "manage:actions"],
  validName: "JSObject1.myFun234y",
  cacheResponse: "",
};

describe("GetJSResponseViewState", () => {
  it("1. returns 'NoResponse' at default state", () => {
    const currentFunction = null,
      isDirty = {},
      isExecuting = {},
      isSaving = false,
      responses = {};

    const expectedState = JSResponseState.NoResponse;
    const actualState = getJSResponseViewState(
      currentFunction,
      isDirty,
      isExecuting,
      isSaving,
      responses,
    );

    expect(expectedState).toBe(actualState);
  });
  it("2. returns 'NoResponse' when an entity is still saving but no execution has begun", () => {
    const currentFunction = TEST_JS_FUNCTION,
      isDirty = {},
      isExecuting = {},
      isSaving = true,
      responses = {};

    const expectedState = JSResponseState.NoResponse;
    const actualState = getJSResponseViewState(
      currentFunction,
      isDirty,
      isExecuting,
      isSaving,
      responses,
    );

    expect(expectedState).toBe(actualState);
  });

  it("3. returns 'IsUpdating' when an entity is still saving and execution has started", () => {
    const currentFunction = TEST_JS_FUNCTION,
      isDirty = {},
      isExecuting = {
        [TEST_JS_FUNCTION_ID]: true,
      },
      isSaving = true,
      responses = {};

    const expectedState = JSResponseState.IsUpdating;
    const actualState = getJSResponseViewState(
      currentFunction,
      isDirty,
      isExecuting,
      isSaving,
      responses,
    );

    expect(expectedState).toBe(actualState);
  });

  it("4. returns 'IsExecuting' when no entity is saving and execution has begun", () => {
    const currentFunction = TEST_JS_FUNCTION,
      isDirty = {},
      isExecuting = {
        [TEST_JS_FUNCTION_ID]: true,
      },
      isSaving = false,
      responses = {};

    const expectedState = JSResponseState.IsExecuting;
    const actualState = getJSResponseViewState(
      currentFunction,
      isDirty,
      isExecuting,
      isSaving,
      responses,
    );

    expect(expectedState).toBe(actualState);
  });

  it("5. returns 'IsDirty' when function has finished executing and there is parse error", () => {
    const currentFunction = TEST_JS_FUNCTION,
      isDirty = {
        [TEST_JS_FUNCTION_ID]: true,
      },
      isExecuting = {
        [TEST_JS_FUNCTION_ID]: false,
      },
      isSaving = false,
      responses = {
        [TEST_JS_FUNCTION_ID]: undefined,
      };

    const expectedState = JSResponseState.IsDirty;
    const actualState = getJSResponseViewState(
      currentFunction,
      isDirty,
      isExecuting,
      isSaving,
      responses,
    );

    expect(expectedState).toBe(actualState);
  });

  it("6. returns 'IsExecuting' when function is still executing and has a previous response", () => {
    const currentFunction = TEST_JS_FUNCTION,
      isDirty = {},
      isExecuting = {
        [TEST_JS_FUNCTION_ID]: true,
      },
      isSaving = false,
      responses = {
        [TEST_JS_FUNCTION_ID]: "test response",
      };

    const expectedState = JSResponseState.IsExecuting;
    const actualState = getJSResponseViewState(
      currentFunction,
      isDirty,
      isExecuting,
      isSaving,
      responses,
    );

    expect(expectedState).toBe(actualState);
  });

  it("7. returns 'NoReturnValue' when function is done executing and returns 'undefined'", () => {
    const currentFunction = TEST_JS_FUNCTION,
      isDirty = {},
      isExecuting = {
        [TEST_JS_FUNCTION_ID]: false,
      },
      isSaving = false,
      responses = {
        [TEST_JS_FUNCTION_ID]: undefined,
      };

    const expectedState = JSResponseState.NoReturnValue;
    const actualState = getJSResponseViewState(
      currentFunction,
      isDirty,
      isExecuting,
      isSaving,
      responses,
    );

    expect(expectedState).toBe(actualState);
  });

  it("8. returns 'ShowResponse' when function is done executing and returns a valid response", () => {
    const currentFunction = TEST_JS_FUNCTION,
      isDirty = {},
      isExecuting = {
        [TEST_JS_FUNCTION_ID]: false,
      },
      isSaving = false,
      responses = {
        [TEST_JS_FUNCTION_ID]: {},
      };

    const expectedState = JSResponseState.ShowResponse;
    const actualState = getJSResponseViewState(
      currentFunction,
      isDirty,
      isExecuting,
      isSaving,
      responses,
    );

    expect(expectedState).toBe(actualState);
  });
  it("9. returns 'IsExecuting' when no entity is saving ,execution has begun and function has a previous response", () => {
    const currentFunction = TEST_JS_FUNCTION,
      isDirty = {},
      isExecuting = {
        [TEST_JS_FUNCTION_ID]: true,
      },
      isSaving = false,
      responses = {
        [TEST_JS_FUNCTION_ID]: "previous response",
      };

    const expectedState = JSResponseState.IsExecuting;
    const actualState = getJSResponseViewState(
      currentFunction,
      isDirty,
      isExecuting,
      isSaving,
      responses,
    );

    expect(expectedState).toBe(actualState);
  });
  it("10. returns 'NoResponse' when no entity is saving , execution has not begun and function has a no previous response", () => {
    const currentFunction = TEST_JS_FUNCTION,
      isDirty = {},
      isExecuting = {
        [TEST_JS_FUNCTION_ID]: false,
      },
      isSaving = false,
      responses = {};

    const expectedState = JSResponseState.NoResponse;
    const actualState = getJSResponseViewState(
      currentFunction,
      isDirty,
      isExecuting,
      isSaving,
      responses,
    );

    expect(expectedState).toBe(actualState);
  });
});
