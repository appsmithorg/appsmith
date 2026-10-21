import { expectSaga } from "redux-saga-test-plan";
import * as matchers from "redux-saga-test-plan/matchers";

import { TriggerKind } from "constants/AppsmithActionConstants/ActionConstants";
import { APP_MODE } from "entities/App";
import type { TriggerMeta } from "ee/sagas/ActionExecution/ActionExecutionSagas";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";
import {
  type AppDetails,
  getAppDetails,
  logDynamicTriggerExecution,
} from "./analyticsSaga";

jest.mock("ee/utils/AnalyticsUtil", () => ({
  __esModule: true,
  default: { logEvent: jest.fn() },
}));

const logEvent = AnalyticsUtil.logEvent as jest.Mock;

const appDetails = (appMode: APP_MODE): AppDetails => ({
  pageId: "page-1",
  appId: "app-1",
  appMode,
  appName: "Invoices",
  isExampleApp: false,
  instanceId: "instance-1",
});

const triggerMeta: TriggerMeta = {
  source: { id: "button-1", name: "Button1" },
  triggerPropertyName: "onClick",
  triggerKind: TriggerKind.EVENT_EXECUTION,
  onPageLoad: false,
};

const state = {
  entities: {
    canvasWidgets: {
      "button-1": {
        widgetId: "button-1",
        widgetName: "Button1",
        type: "BUTTON_WIDGET",
        dynamicPropertyPathList: [],
      },
    },
  },
};

const run = async (appMode: APP_MODE, errors: unknown) =>
  expectSaga(logDynamicTriggerExecution, {
    dynamicTrigger: "{{GetInvoices.run()}}",
    errors,
    triggerMeta,
  })
    .withState(state)
    .provide([[matchers.call.fn(getAppDetails), appDetails(appMode)]])
    .run({ silenceTimeout: true });

const eventNames = () => logEvent.mock.calls.map(([name]) => name);

describe("logDynamicTriggerExecution", () => {
  beforeEach(() => {
    logEvent.mockClear();
  });

  it("does not report executions triggered in a published app", async () => {
    await run(APP_MODE.PUBLISHED, []);

    expect(eventNames()).toEqual([]);
  });

  it("reports executions triggered in the editor", async () => {
    await run(APP_MODE.EDIT, []);

    expect(eventNames()).toEqual(["EXECUTE_ACTION"]);
    expect(logEvent).toHaveBeenCalledWith(
      "EXECUTE_ACTION",
      expect.objectContaining({
        type: "JS_EXPRESSION",
        appMode: APP_MODE.EDIT,
        widgetName: "Button1",
        propertyName: "onClick",
      }),
    );
  });

  it("still reports failures in a published app, without a success event", async () => {
    await run(APP_MODE.PUBLISHED, [{ message: "boom" }]);

    expect(eventNames()).toEqual(["EXECUTE_ACTION_FAILURE"]);
  });

  it("never sends a success event", async () => {
    await run(APP_MODE.EDIT, []);

    expect(eventNames()).not.toContain("EXECUTE_ACTION_SUCCESS");
  });
});
