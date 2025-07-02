import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";
import { ENTITY_TYPE, PLATFORM_ERROR } from "ee/entities/AppsmithConsole/utils";
import { getJSCollectionFromAllEntities } from "ee/selectors/entitiesSelector";
import type { Action } from "entities/Action";
import LOG_TYPE from "entities/AppsmithConsole/logtype";
import type { JSAction, JSCollection } from "entities/JSCollection";
import { appsmithTelemetry } from "instrumentation";
import {
  endSpan,
  setAttributesToSpan,
  startRootSpan,
} from "instrumentation/generateTraces";
import log from "loglevel";
import { expectSaga } from "redux-saga-test-plan";
import { call, select } from "redux-saga/effects";
import { executePageUnloadActionsSaga } from "sagas/ActionExecution/PluginActionSaga";
import { handleExecuteJSFunctionSaga } from "sagas/JSPaneSagas";
import {
  getCurrentPageId,
  getLayoutOnUnloadActions,
} from "selectors/editorSelectors";
import AppsmithConsole from "utils/AppsmithConsole";

// Mock dependencies
jest.mock("sagas/JSPaneSagas");
jest.mock("instrumentation", () => ({
  appsmithTelemetry: {
    captureException: jest.fn(),
    getTraceAndContext: jest.fn(() => ({ context: {} })),
  },
}));
jest.mock("instrumentation/generateTraces");
jest.mock("loglevel");
jest.mock("utils/AppsmithConsole");

// For testing executeOnPageUnloadJSAction directly if it were exported
// We will test it indirectly via executePageUnloadActionsSaga
const MOCK_JS_ACTION: JSAction = {
  id: "jsAction1",
  baseId: "jsAction1",
  name: "myFun",
  collectionId: "jsCollection1",
  fullyQualifiedName: "JSObject1.myFun",
  pluginType: "JS",
  pluginId: "pluginId1",
  workspaceId: "ws1",
  applicationId: "app1",
  pageId: "page1",
  runBehaviour: "ON_PAGE_LOAD",
  dynamicBindingPathList: [],
  isValid: true,
  invalids: [],
  jsonPathKeys: [],
  cacheResponse: "",
  messages: [],
  actionConfiguration: {
    body: "return 1;",
    timeoutInMillisecond: 5000,
    jsArguments: [],
  },
  clientSideExecution: true,
} as JSAction;

const MOCK_JS_COLLECTION: JSCollection = {
  id: "jsCollection1",
  name: "JSObject1",
  pageId: "page1",
  actions: [MOCK_JS_ACTION],
} as JSCollection;

const MOCK_ACTION_TRIGGER: Action = {
  id: "jsAction1",
  name: "JSObject1.myFun",
  collectionId: "jsCollection1",
  pluginId: "pluginId1",
  pluginType: "JS",
  jsonPathKeys: [],
  eventData: {},
  pageId: "page1",
  applicationId: "app1",
  workspaceId: "ws1",
  datasourceUrl: "",
} as unknown as Action;

describe("OnPageUnloadSaga", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("executePageUnloadActionsSaga", () => {
    it("should do nothing and dispatch SUCCESS if no actions are present", async () => {
      const span = startRootSpan("executePageUnloadActionsSaga");

      return expectSaga(executePageUnloadActionsSaga)
        .provide([[select(getLayoutOnUnloadActions), []]])
        .put({ type: ReduxActionTypes.EXECUTE_PAGE_UNLOAD_ACTIONS_SUCCESS })
        .run()
        .then(() => {
          expect(startRootSpan).toHaveBeenCalledWith(
            "executePageUnloadActionsSaga",
          );
          expect(setAttributesToSpan).toHaveBeenCalledWith(span, {
            numActions: 0,
          });
          expect(handleExecuteJSFunctionSaga).not.toHaveBeenCalled();
          expect(endSpan).toHaveBeenCalled();
        });
    });

    it("should execute a single JS action", async () => {
      const actionsToRun = [MOCK_ACTION_TRIGGER];
      const span = startRootSpan("executePageUnloadActionsSaga");

      return expectSaga(executePageUnloadActionsSaga)
        .provide([
          [select(getLayoutOnUnloadActions), actionsToRun],
          [select(getCurrentPageId), "page1"],
          [
            select(getJSCollectionFromAllEntities, "jsCollection1"),
            MOCK_JS_COLLECTION,
          ],
          [
            call(
              handleExecuteJSFunctionSaga,
              expect.objectContaining({ action: MOCK_JS_ACTION }),
            ),
            undefined, // Mock successful execution
          ],
        ])
        .put({ type: ReduxActionTypes.EXECUTE_PAGE_UNLOAD_ACTIONS_SUCCESS })
        .run()
        .then(() => {
          expect(setAttributesToSpan).toHaveBeenCalledWith(span, {
            numActions: 1,
          });
          expect(handleExecuteJSFunctionSaga).toHaveBeenCalledTimes(1);
          expect(handleExecuteJSFunctionSaga).toHaveBeenCalledWith(
            expect.objectContaining({
              action: MOCK_JS_ACTION,
              collection: MOCK_JS_COLLECTION,
              isExecuteJSFunc: true,
              onPageLoad: false,
            }),
          );
        });
    });

    it("should execute multiple JS actions in parallel", async () => {
      const span = startRootSpan("executePageUnloadActionsSaga");
      const anotherJsAction: JSAction = {
        ...MOCK_JS_ACTION,
        id: "jsAction2",
      };
      const anotherCollection: JSCollection = {
        ...MOCK_JS_COLLECTION,
        id: "jsCollection2",
        actions: [anotherJsAction],
      };
      const anotherActionTrigger: Action = {
        ...MOCK_ACTION_TRIGGER,
        id: "jsAction2",
        collectionId: "jsCollection2",
      };
      const actionsToRun = [MOCK_ACTION_TRIGGER, anotherActionTrigger];

      return expectSaga(executePageUnloadActionsSaga)
        .provide([
          [select(getLayoutOnUnloadActions), actionsToRun],
          [select(getCurrentPageId), "page1"],
          [
            select(getJSCollectionFromAllEntities, "jsCollection1"),
            MOCK_JS_COLLECTION,
          ],
          [
            select(getJSCollectionFromAllEntities, "jsCollection2"),
            anotherCollection,
          ],
          [
            call(
              handleExecuteJSFunctionSaga,
              expect.objectContaining({ action: MOCK_JS_ACTION }),
            ),
            undefined,
          ],
          [
            call(
              handleExecuteJSFunctionSaga,
              expect.objectContaining({ action: anotherJsAction }),
            ),
            undefined,
          ],
        ])
        .put({ type: ReduxActionTypes.EXECUTE_PAGE_UNLOAD_ACTIONS_SUCCESS })
        .run()
        .then(() => {
          expect(setAttributesToSpan).toHaveBeenCalledWith(span, {
            numActions: 2,
          });
          expect(handleExecuteJSFunctionSaga).toHaveBeenCalledTimes(2);
        });
    });

    it("should handle JS execution errors gracefully and still dispatch SUCCESS", async () => {
      const actionsToRun = [MOCK_ACTION_TRIGGER];
      const span = startRootSpan("executePageUnloadActionsSaga");

      return expectSaga(executePageUnloadActionsSaga)
        .provide([
          [select(getLayoutOnUnloadActions), actionsToRun],
          [select(getCurrentPageId), "page1"],
          [
            select(getJSCollectionFromAllEntities, "jsCollection1"),
            MOCK_JS_COLLECTION,
          ],
          [
            call(
              handleExecuteJSFunctionSaga,
              expect.objectContaining({ action: MOCK_JS_ACTION }),
            ),
            // handleExecuteJSFunctionSaga doesn't throw - it catches errors internally
            undefined, // Mock successful execution (even though there's an internal error)
          ],
        ])
        .put({ type: ReduxActionTypes.EXECUTE_PAGE_UNLOAD_ACTIONS_SUCCESS })
        .run()
        .then(() => {
          expect(setAttributesToSpan).toHaveBeenCalledWith(span, {
            numActions: 1,
          });
          expect(handleExecuteJSFunctionSaga).toHaveBeenCalledTimes(1);
          expect(handleExecuteJSFunctionSaga).toHaveBeenCalledWith(
            expect.objectContaining({
              action: MOCK_JS_ACTION,
              collection: MOCK_JS_COLLECTION,
              isExecuteJSFunc: true,
              onPageLoad: false,
            }),
          );
          // The error handling happens inside handleExecuteJSFunctionSaga via AppsmithConsole.addErrors
          // We don't expect log.error or AppsmithConsole.error to be called here
          expect(log.error).not.toHaveBeenCalled();
          expect(AppsmithConsole.error).not.toHaveBeenCalled();
          expect(endSpan).toHaveBeenCalled();
        });
    });

    it("should handle actual JS execution errors via AppsmithConsole.addErrors", async () => {
      const actionsToRun = [MOCK_ACTION_TRIGGER];
      const span = startRootSpan("executePageUnloadActionsSaga");

      // Mock handleExecuteJSFunctionSaga to simulate internal error handling
      const mockHandleExecuteJSFunctionSaga = jest
        .fn()
        .mockImplementation(function* () {
          // Simulate the internal error handling that happens in handleExecuteJSFunctionSaga
          AppsmithConsole.addErrors([
            {
              payload: {
                id: MOCK_JS_ACTION.id,
                logType: LOG_TYPE.JS_EXECUTION_ERROR,
                text: "JS execution failed",
                source: {
                  type: ENTITY_TYPE.JSACTION,
                  name: "JSObject1.myFun",
                  id: "jsCollection1",
                },
                messages: [
                  {
                    message: {
                      name: "Error",
                      message: "JS execution failed",
                    },
                    type: PLATFORM_ERROR.PLUGIN_EXECUTION,
                  },
                ],
              },
            },
          ]);
        });

      // Replace the mocked function temporarily
      const originalHandleExecuteJSFunctionSaga = handleExecuteJSFunctionSaga;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (handleExecuteJSFunctionSaga as any) = mockHandleExecuteJSFunctionSaga;

      return expectSaga(executePageUnloadActionsSaga)
        .provide([
          [select(getLayoutOnUnloadActions), actionsToRun],
          [select(getCurrentPageId), "page1"],
          [
            select(getJSCollectionFromAllEntities, "jsCollection1"),
            MOCK_JS_COLLECTION,
          ],
        ])
        .put({ type: ReduxActionTypes.EXECUTE_PAGE_UNLOAD_ACTIONS_SUCCESS })
        .run()
        .then(() => {
          expect(setAttributesToSpan).toHaveBeenCalledWith(span, {
            numActions: 1,
          });
          expect(mockHandleExecuteJSFunctionSaga).toHaveBeenCalledTimes(1);
          expect(AppsmithConsole.addErrors).toHaveBeenCalledWith([
            expect.objectContaining({
              payload: expect.objectContaining({
                id: MOCK_JS_ACTION.id,
                logType: LOG_TYPE.JS_EXECUTION_ERROR,
              }),
            }),
          ]);
          expect(endSpan).toHaveBeenCalled();

          // Restore the original function
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (handleExecuteJSFunctionSaga as any) =
            originalHandleExecuteJSFunctionSaga;
        });
    });

    it("should handle missing collectionId in action trigger gracefully", async () => {
      const actionWithNoCollectionId = {
        ...MOCK_ACTION_TRIGGER,
        collectionId: undefined,
      };
      const actionsToRun = [actionWithNoCollectionId];

      return expectSaga(executePageUnloadActionsSaga)
        .provide([
          [select(getLayoutOnUnloadActions), actionsToRun],
          [select(getCurrentPageId), "page1"],
          // No collection fetch or JS execution should happen
        ])
        .put({ type: ReduxActionTypes.EXECUTE_PAGE_UNLOAD_ACTIONS_SUCCESS })
        .run()
        .then(() => {
          expect(handleExecuteJSFunctionSaga).not.toHaveBeenCalled();
          expect(appsmithTelemetry.captureException).not.toHaveBeenCalled();
        });
    });

    it("should capture exception if JS collection is not found", async () => {
      const actionsToRun = [MOCK_ACTION_TRIGGER];

      return expectSaga(executePageUnloadActionsSaga)
        .provide([
          [select(getLayoutOnUnloadActions), actionsToRun],
          [select(getCurrentPageId), "page1"],
          [
            select(getJSCollectionFromAllEntities, "jsCollection1"),
            undefined, // Collection not found
          ],
        ])
        .put({ type: ReduxActionTypes.EXECUTE_PAGE_UNLOAD_ACTIONS_SUCCESS }) // Still success, as the saga itself doesn't fail here
        .run()
        .then(() => {
          expect(appsmithTelemetry.captureException).toHaveBeenCalledWith(
            expect.any(Error),
            expect.objectContaining({
              errorName: "MissingJSCollection",
              extra: {
                collectionId: "jsCollection1",
                actionId: "jsAction1",
                pageId: "page1",
              },
            }),
          );
          expect(handleExecuteJSFunctionSaga).not.toHaveBeenCalled();
        });
    });

    it("should not call handleExecuteJSFunctionSaga if JSAction is not found in collection", async () => {
      const collectionWithMissingAction: JSCollection = {
        ...MOCK_JS_COLLECTION,
        actions: [], // No actions in collection
      };
      const actionsToRun = [MOCK_ACTION_TRIGGER];

      return expectSaga(executePageUnloadActionsSaga)
        .provide([
          [select(getLayoutOnUnloadActions), actionsToRun],
          [select(getCurrentPageId), "page1"],
          [
            select(getJSCollectionFromAllEntities, "jsCollection1"),
            collectionWithMissingAction,
          ],
        ])
        .put({ type: ReduxActionTypes.EXECUTE_PAGE_UNLOAD_ACTIONS_SUCCESS })
        .run()
        .then(() => {
          expect(handleExecuteJSFunctionSaga).not.toHaveBeenCalled();
        });
    });
  });
});
