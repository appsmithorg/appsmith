import {
  defaultAffectedJSObjects,
  evalAndLintingHandler,
  evalQueueBuffer,
  evaluateTreeSaga,
  evaluationLoopWithDebounce,
  type BUFFERED_ACTION,
} from "./EvaluationsSaga";
import { evalWorker } from "utils/workerInstances";
import { expectSaga, testSaga } from "redux-saga-test-plan";

import { EVAL_WORKER_ACTIONS } from "ee/workers/Evaluation/evalWorkerActions";
import { select } from "redux-saga/effects";
import { getMetaWidgets, getWidgets, getWidgetsMeta } from "./selectors";
import { getAllActionValidationConfig } from "ee//selectors/entitiesSelector";
import { getSelectedAppTheme } from "selectors/appThemingSelectors";
import { getAppMode } from "ee/selectors/applicationSelectors";
import * as log from "loglevel";

import type { ReduxAction } from "actions/ReduxActionTypes";
import {
  ReduxActionErrorTypes,
  ReduxActionTypes,
} from "ee/constants/ReduxActionConstants";
import { fetchPluginFormConfigsSuccess } from "actions/pluginActions";
import { createJSCollectionSuccess } from "actions/jsActionActions";
import { getInstanceId } from "ee/selectors/organizationSelectors";
import {
  getApplicationLastDeployedAt,
  getCurrentApplicationId,
  getCurrentPageId,
} from "selectors/editorSelectors";
import { updateActionData } from "actions/pluginActionActions";

jest.mock("loglevel");

describe("evaluateTreeSaga", () => {
  afterAll(() => {
    jest.unmock("loglevel");
  });
  test("should set 'shouldRespondWithLogs'to evaluations when the log level is debug", async () => {
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (log.getLevel as any).mockReturnValue(log.levels.DEBUG);
    const unEvalAndConfigTree = { unEvalTree: {}, configTree: {} };

    return expectSaga(evaluateTreeSaga, unEvalAndConfigTree)
      .provide([
        [select(getAllActionValidationConfig), {}],
        [select(getWidgets), {}],
        [select(getMetaWidgets), {}],
        [select(getSelectedAppTheme), {}],
        [select(getAppMode), false],
        [select(getWidgetsMeta), {}],
        [select(getInstanceId), "instanceId"],
        [select(getCurrentApplicationId), "applicationId"],
        [select(getCurrentPageId), "pageId"],
        [
          select(getApplicationLastDeployedAt),
          new Date("11 September 2024").toISOString(),
        ],
      ])
      .call(evalWorker.request, EVAL_WORKER_ACTIONS.EVAL_TREE, {
        cacheProps: {
          instanceId: "instanceId",
          appId: "applicationId",
          pageId: "pageId",
          appMode: false,
          timestamp: new Date("11 September 2024").toISOString(),
        },
        unevalTree: unEvalAndConfigTree,
        widgetTypeConfigMap: undefined,
        widgets: {},
        theme: {},
        shouldReplay: true,
        allActionValidationConfig: {},
        forceEvaluation: false,
        metaWidgets: {},
        appMode: false,
        widgetsMeta: {},
        shouldRespondWithLogs: true,
        affectedJSObjects: { ids: [], isAllAffected: false },
        actionDataPayloadConsolidated: undefined,
      })
      .run();
  });
  test("should set 'shouldRespondWithLogs' to false when the log level is not debug", async () => {
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (log.getLevel as any).mockReturnValue(log.levels.INFO);
    const unEvalAndConfigTree = { unEvalTree: {}, configTree: {} };

    return expectSaga(evaluateTreeSaga, unEvalAndConfigTree)
      .provide([
        [select(getAllActionValidationConfig), {}],
        [select(getWidgets), {}],
        [select(getMetaWidgets), {}],
        [select(getSelectedAppTheme), {}],
        [select(getAppMode), false],
        [select(getWidgetsMeta), {}],
        [select(getInstanceId), "instanceId"],
        [select(getCurrentApplicationId), "applicationId"],
        [select(getCurrentPageId), "pageId"],
        [
          select(getApplicationLastDeployedAt),
          new Date("11 September 2024").toISOString(),
        ],
      ])
      .call(evalWorker.request, EVAL_WORKER_ACTIONS.EVAL_TREE, {
        cacheProps: {
          instanceId: "instanceId",
          appId: "applicationId",
          pageId: "pageId",
          appMode: false,
          timestamp: new Date("11 September 2024").toISOString(),
        },
        unevalTree: unEvalAndConfigTree,
        widgetTypeConfigMap: undefined,
        widgets: {},
        theme: {},
        shouldReplay: true,
        allActionValidationConfig: {},
        forceEvaluation: false,
        metaWidgets: {},
        appMode: false,
        widgetsMeta: {},
        shouldRespondWithLogs: false,
        affectedJSObjects: { ids: [], isAllAffected: false },
        actionDataPayloadConsolidated: undefined,
      })
      .run();
  });
  test("should propagate affectedJSObjects property to evaluation action", async () => {
    const unEvalAndConfigTree = { unEvalTree: {}, configTree: {} };
    const affectedJSObjects = {
      isAllAffected: false,
      ids: ["1", "2"],
    };

    return expectSaga(
      evaluateTreeSaga,
      unEvalAndConfigTree,
      [],
      undefined,
      undefined,
      undefined,
      affectedJSObjects,
    )
      .provide([
        [select(getAllActionValidationConfig), {}],
        [select(getWidgets), {}],
        [select(getMetaWidgets), {}],
        [select(getSelectedAppTheme), {}],
        [select(getAppMode), false],
        [select(getWidgetsMeta), {}],
        [select(getInstanceId), "instanceId"],
        [select(getCurrentApplicationId), "applicationId"],
        [select(getCurrentPageId), "pageId"],
        [
          select(getApplicationLastDeployedAt),
          new Date("11 September 2024").toISOString(),
        ],
      ])
      .call(evalWorker.request, EVAL_WORKER_ACTIONS.EVAL_TREE, {
        cacheProps: {
          instanceId: "instanceId",
          appId: "applicationId",
          pageId: "pageId",
          appMode: false,
          timestamp: new Date("11 September 2024").toISOString(),
        },
        unevalTree: unEvalAndConfigTree,
        widgetTypeConfigMap: undefined,
        widgets: {},
        theme: {},
        shouldReplay: true,
        allActionValidationConfig: {},
        forceEvaluation: false,
        metaWidgets: {},
        appMode: false,
        widgetsMeta: {},
        shouldRespondWithLogs: false,
        affectedJSObjects,
        actionDataPayloadConsolidated: undefined,
      })
      .run();
  });
});

describe("evalQueueBuffer", () => {
  test("should return a buffered action with the default affectedJSObjects state for an action which does not have affectedJSObjects associated to it", () => {
    const buffer = evalQueueBuffer();

    // this action does not generate an affectedJSObject
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    buffer.put(fetchPluginFormConfigsSuccess({} as any));
    const bufferedAction = buffer.take();

    expect(bufferedAction).toEqual({
      actionDataPayloadConsolidated: [],
      hasBufferedAction: true,
      hasDebouncedHandleUpdate: false,
      type: ReduxActionTypes.BUFFERED_ACTION,
      affectedJSObjects: defaultAffectedJSObjects,
      postEvalActions: [],
    });
  });
  test("should club all JS actions affectedJSObjects's ids", () => {
    const buffer = evalQueueBuffer();

    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    buffer.put(createJSCollectionSuccess({ id: "1" } as any));
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    buffer.put(createJSCollectionSuccess({ id: "2" } as any));
    const bufferedAction = buffer.take();

    expect(bufferedAction).toEqual({
      actionDataPayloadConsolidated: [],
      hasBufferedAction: true,
      hasDebouncedHandleUpdate: false,
      type: ReduxActionTypes.BUFFERED_ACTION,
      affectedJSObjects: { ids: ["1", "2"], isAllAffected: false },
      postEvalActions: [],
    });
  });
  test("should return all JS actions that have changed when there is a pending action which affects all JS actions ", () => {
    const buffer = evalQueueBuffer();

    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    buffer.put(createJSCollectionSuccess({ id: "1" } as any));
    // this action triggers an isAllAffected flag
    buffer.put({
      type: ReduxActionErrorTypes.FETCH_JS_ACTIONS_ERROR,
    } as ReduxAction<unknown>);
    // queue is not empty
    expect(buffer.isEmpty()).not.toBeTruthy();

    const bufferedAction = buffer.take();

    expect(bufferedAction).toEqual({
      actionDataPayloadConsolidated: [],
      hasBufferedAction: true,
      hasDebouncedHandleUpdate: false,
      type: ReduxActionTypes.BUFFERED_ACTION,
      affectedJSObjects: { ids: [], isAllAffected: true },
      postEvalActions: [],
    });
    expect(buffer.isEmpty()).toBeTruthy();
  });
  test("should reset the collectedAffectedJSObjects after the buffered action has been dequeued and the subsequent actions should have the defaultAffectedJSObjects", () => {
    const buffer = evalQueueBuffer();

    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    buffer.put(createJSCollectionSuccess({ id: "1" } as any));
    const bufferedAction = buffer.take();

    expect(bufferedAction).toEqual({
      actionDataPayloadConsolidated: [],
      hasBufferedAction: true,
      hasDebouncedHandleUpdate: false,
      type: ReduxActionTypes.BUFFERED_ACTION,
      affectedJSObjects: { ids: ["1"], isAllAffected: false },
      postEvalActions: [],
    });
    expect(buffer.isEmpty()).toBeTruthy();
    // this action does not generate an affectedJSObject, So the subsequent buffered action should have default affectedJSObjects
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    buffer.put(fetchPluginFormConfigsSuccess({ id: "1" } as any));
    const bufferedActionsWithDefaultAffectedJSObjects = buffer.take();

    expect(bufferedActionsWithDefaultAffectedJSObjects).toEqual({
      actionDataPayloadConsolidated: [],
      hasBufferedAction: true,
      hasDebouncedHandleUpdate: false,
      type: ReduxActionTypes.BUFFERED_ACTION,
      affectedJSObjects: defaultAffectedJSObjects,
      postEvalActions: [],
    });
  });
  test("should debounce UPDATE_ACTION_DATA actions together when the buffer is busy", () => {
    const buffer = evalQueueBuffer();

    buffer.put(
      updateActionData([
        {
          entityName: "widget1",
          dataPath: "data",
          data: { a: 1 },
          dataPathRef: "",
        },
      ]),
    );
    buffer.put(
      updateActionData([
        {
          entityName: "widget2",
          dataPath: "data",
          data: { a: 2 },
          dataPathRef: "",
        },
      ]),
    );
    const bufferedActionsWithDefaultAffectedJSObjects = buffer.take();

    expect(bufferedActionsWithDefaultAffectedJSObjects).toEqual({
      actionDataPayloadConsolidated: [
        {
          data: {
            a: 1,
          },
          dataPath: "data",
          dataPathRef: "",
          entityName: "widget1",
        },
        {
          data: {
            a: 2,
          },
          dataPath: "data",
          dataPathRef: "",
          entityName: "widget2",
        },
      ],

      hasBufferedAction: false,
      hasDebouncedHandleUpdate: true,
      type: ReduxActionTypes.BUFFERED_ACTION,
      affectedJSObjects: defaultAffectedJSObjects,
      postEvalActions: [],
    });
  });
  test("should be able to debounce UPDATE_ACTION_DATA actions and BUFFERED_ACTION together when the buffer is busy", () => {
    const buffer = evalQueueBuffer();

    buffer.put(
      updateActionData([
        {
          entityName: "widget1",
          dataPath: "data",
          data: { a: 1 },
          dataPathRef: "",
        },
      ]),
    );
    buffer.put(
      updateActionData([
        {
          entityName: "widget2",
          dataPath: "data",
          data: { a: 2 },
          dataPathRef: "",
        },
      ]),
    );

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    buffer.put(createJSCollectionSuccess({ id: "1" } as any));

    const bufferedActionsWithDefaultAffectedJSObjects = buffer.take();

    expect(bufferedActionsWithDefaultAffectedJSObjects).toEqual({
      actionDataPayloadConsolidated: [
        {
          data: {
            a: 1,
          },
          dataPath: "data",
          dataPathRef: "",
          entityName: "widget1",
        },
        {
          data: {
            a: 2,
          },
          dataPath: "data",
          dataPathRef: "",
          entityName: "widget2",
        },
      ],

      hasBufferedAction: true,
      hasDebouncedHandleUpdate: true,
      type: ReduxActionTypes.BUFFERED_ACTION,
      affectedJSObjects: { ids: ["1"], isAllAffected: false },
      postEvalActions: [],
    });
  });
});

describe("evaluationLoopWithDebounce", () => {
  describe("debounce", () => {
    test("should call a regular evaluation with the consolidated action data payload when both updateActionData and evaluation action is triggered", async () => {
      const buffer = evalQueueBuffer();

      buffer.put(
        updateActionData([
          {
            entityName: "widget1",
            dataPath: "data",
            data: { a: 1 },
            dataPathRef: "",
          },
        ]),
      );
      buffer.put(
        updateActionData([
          {
            entityName: "widget2",
            dataPath: "data",
            data: { a: 2 },
            dataPathRef: "",
          },
        ]),
      );
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      buffer.put(createJSCollectionSuccess({ id: "1" } as any));
      const action = buffer.take();

      const mockChannel = "mock-channel";

      // assert that a regular evaluation is only triggered and no evalTreeWithChanges evaluation is triggered
      return (
        testSaga(evaluationLoopWithDebounce, mockChannel)
          .next()
          .take(mockChannel)
          .next(action)
          .call(evalAndLintingHandler, true, action, {
            actionDataPayloadConsolidated: [
              {
                entityName: "widget1",
                dataPath: "data",
                data: { a: 1 },
                dataPathRef: "",
              },
              {
                entityName: "widget2",
                dataPath: "data",
                data: { a: 2 },
                dataPathRef: "",
              },
            ],
            shouldReplay: undefined,
            forceEvaluation: false,
            requiresLogging: undefined,
            affectedJSObjects: { isAllAffected: false, ids: ["1"] },
          })
          .next()
          // wait for the next action in the event loop
          .take(mockChannel)
      );
    });
    test("should call an evalTreeWithChanges when only updateActionData actions are triggered", async () => {
      const buffer = evalQueueBuffer();

      buffer.put(
        updateActionData([
          {
            entityName: "widget1",
            dataPath: "data",
            data: { a: 1 },
            dataPathRef: "",
          },
        ]),
      );
      buffer.put(
        updateActionData([
          {
            entityName: "widget2",
            dataPath: "data",
            data: { a: 2 },
            dataPathRef: "",
          },
        ]),
      );
      const action = buffer.take() as unknown as BUFFERED_ACTION;

      const mockChannel = "mock-channel";

      return (
        testSaga(evaluationLoopWithDebounce, mockChannel)
          .next()
          .take(mockChannel)
          .next(action)
          .call(
            evalWorker.request,
            EVAL_WORKER_ACTIONS.UPDATE_ACTION_DATA,
            action.actionDataPayloadConsolidated,
          )
          .next()
          // wait for the next action in the event loop
          .take(mockChannel)
      );
    });
    test("should call a regular evaluation when evaluation actions are triggered", async () => {
      const buffer = evalQueueBuffer();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      buffer.put(createJSCollectionSuccess({ id: "1" } as any));

      const action = buffer.take();

      const mockChannel = "mock-channel";

      return (
        testSaga(evaluationLoopWithDebounce, mockChannel)
          .next()
          .take(mockChannel)
          .next(action)
          .call(evalAndLintingHandler, true, action, {
            shouldReplay: undefined,
            forceEvaluation: false,
            requiresLogging: undefined,
            affectedJSObjects: { isAllAffected: false, ids: ["1"] },
          })
          .next()
          // wait for the next action in the event loop
          .take(mockChannel)
      );
    });
  });
});
