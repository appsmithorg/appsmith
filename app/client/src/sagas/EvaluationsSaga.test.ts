import { evaluateTreeSaga, evalWorker } from "./EvaluationsSaga";
import { expectSaga } from "redux-saga-test-plan";
import { EVAL_WORKER_ACTIONS } from "@appsmith/workers/Evaluation/evalWorkerActions";
import { select } from "redux-saga/effects";
import { getMetaWidgets, getWidgets, getWidgetsMeta } from "./selectors";
import { getAllActionValidationConfig } from "@appsmith//selectors/entitiesSelector";
import { getSelectedAppTheme } from "selectors/appThemingSelectors";
import { getAppMode } from "@appsmith/selectors/applicationSelectors";
import * as log from "loglevel";
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
      })
      .run();
  });
});
