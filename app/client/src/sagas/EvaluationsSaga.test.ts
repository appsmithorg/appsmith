import {
  defaultAffectedJSObjects,
  evalQueueBuffer,
  evaluateTreeSaga,
  evalWorker,
} from "./EvaluationsSaga";
import { expectSaga } from "redux-saga-test-plan";
import { EVAL_WORKER_ACTIONS } from "@appsmith/workers/Evaluation/evalWorkerActions";
import { select } from "redux-saga/effects";
import { getMetaWidgets, getWidgets, getWidgetsMeta } from "./selectors";
import { getAllActionValidationConfig } from "@appsmith//selectors/entitiesSelector";
import { getSelectedAppTheme } from "selectors/appThemingSelectors";
import { getAppMode } from "@appsmith/selectors/applicationSelectors";
import * as log from "loglevel";

import type { ReduxAction } from "@appsmith/constants/ReduxActionConstants";
import {
  ReduxActionErrorTypes,
  ReduxActionTypes,
} from "@appsmith/constants/ReduxActionConstants";
import { fetchPluginFormConfigsSuccess } from "actions/pluginActions";
import { createJSCollectionSuccess } from "actions/jsActionActions";
jest.mock("loglevel");

describe("evaluateTreeSaga", () => {
  afterAll(() => {
    jest.unmock("loglevel");
  });
  test("should set 'shouldRespondWithLogs'to evaluations when the log level is debug", async () => {
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
      ])
      .call(evalWorker.request, EVAL_WORKER_ACTIONS.EVAL_TREE, {
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
      })
      .run();
  });
  test("should set 'shouldRespondWithLogs' to false when the log level is not debug", async () => {
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
      ])
      .call(evalWorker.request, EVAL_WORKER_ACTIONS.EVAL_TREE, {
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
      ])
      .call(evalWorker.request, EVAL_WORKER_ACTIONS.EVAL_TREE, {
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
      })
      .run();
  });
});

describe("evalQueueBuffer", () => {
  test("should return a buffered action with the default affectedJSObjects state for an action which does not have affectedJSObjects associated to it", () => {
    const buffer = evalQueueBuffer();
    // this action does not generate an affectedJSObject
    buffer.put(fetchPluginFormConfigsSuccess({} as any));
    const bufferedAction = buffer.take();
    expect(bufferedAction).toEqual({
      type: ReduxActionTypes.BUFFERED_ACTION,
      affectedJSObjects: defaultAffectedJSObjects,
      postEvalActions: [],
    });
  });
  test("should club all JS actions affectedJSObjects's ids", () => {
    const buffer = evalQueueBuffer();
    buffer.put(createJSCollectionSuccess({ id: "1" } as any));
    buffer.put(createJSCollectionSuccess({ id: "2" } as any));
    const bufferedAction = buffer.take();
    expect(bufferedAction).toEqual({
      type: ReduxActionTypes.BUFFERED_ACTION,
      affectedJSObjects: { ids: ["1", "2"], isAllAffected: false },
      postEvalActions: [],
    });
  });
  test("should return all JS actions that have changed when there is a pending action which affects all JS actions ", () => {
    const buffer = evalQueueBuffer();
    buffer.put(createJSCollectionSuccess({ id: "1" } as any));
    // this action triggers an isAllAffected flag
    buffer.put({
      type: ReduxActionErrorTypes.FETCH_JS_ACTIONS_ERROR,
    } as ReduxAction<unknown>);
    // queue is not empty
    expect(buffer.isEmpty()).not.toBeTruthy();

    const bufferedAction = buffer.take();
    expect(bufferedAction).toEqual({
      type: ReduxActionTypes.BUFFERED_ACTION,
      affectedJSObjects: { ids: [], isAllAffected: true },
      postEvalActions: [],
    });
    expect(buffer.isEmpty()).toBeTruthy();
  });
  test("should reset the collectedAffectedJSObjects after the buffered action has been dequeued and the subsequent actions should have the defaultAffectedJSObjects", () => {
    const buffer = evalQueueBuffer();
    buffer.put(createJSCollectionSuccess({ id: "1" } as any));
    const bufferedAction = buffer.take();
    expect(bufferedAction).toEqual({
      type: ReduxActionTypes.BUFFERED_ACTION,
      affectedJSObjects: { ids: ["1"], isAllAffected: false },
      postEvalActions: [],
    });
    expect(buffer.isEmpty()).toBeTruthy();
    // this action does not generate an affectedJSObject, So the subsequent buffered action should have default affectedJSObjects
    buffer.put(fetchPluginFormConfigsSuccess({ id: "1" } as any));
    const bufferedActionsWithDefaultAffectedJSObjects = buffer.take();
    expect(bufferedActionsWithDefaultAffectedJSObjects).toEqual({
      type: ReduxActionTypes.BUFFERED_ACTION,
      affectedJSObjects: defaultAffectedJSObjects,
      postEvalActions: [],
    });
  });
});
