import { call, put, select } from "redux-saga/effects";
import ApplicationApi from "ee/api/ApplicationApi";
import {
  ReduxActionErrorTypes,
  ReduxActionTypes,
} from "ee/constants/ReduxActionConstants";
import { getCurrentApplicationId } from "selectors/editorSelectors";
import { getCurrentWorkspaceId } from "ee/selectors/selectedWorkspaceSelectors";
import {
  copyActionToAppSaga,
  copyJSActionToAppSaga,
  fetchAppsForCopyTargetSaga,
  fetchPagesForCopyTargetSaga,
} from "ee/sagas/CopyToAppSagas";
import PageApi from "api/PageApi";
import { APP_MODE } from "entities/App";
import { validateResponse } from "sagas/ErrorSagas";
import { CopyToAppEntityType } from "pages/Editor/Explorer/CopyToApp/types";

const toastShow = jest.fn();
const logEvent = jest.fn();

jest.mock("@appsmith/ads", () => ({
  toast: {
    show: (...args: unknown[]) => toastShow(...args),
  },
}));

// Mock ErrorSagas so importing it does not pull in the full store/saga tree.
// The saga uses `call(validateResponse, ...)`, so the test asserts against this
// same mocked reference.
jest.mock("sagas/ErrorSagas", () => ({
  validateResponse: jest.fn(),
}));

jest.mock("ee/utils/AnalyticsUtil", () => ({
  __esModule: true,
  default: {
    logEvent: (...args: unknown[]) => logEvent(...args),
  },
}));

const basePayload = {
  entityId: "entity-1",
  entityName: "Query1",
  sourcePageId: "source-page-1",
  targetWorkspaceId: "target-ws-1",
  targetApplicationId: "target-app-1",
  targetApplicationName: "App B",
  targetPageId: "target-page-1",
  targetPageName: "Page1",
  onSuccess: jest.fn(),
};

describe("copyActionToAppSaga", () => {
  it("delegates with an action export body (actionList populated)", () => {
    const gen = copyActionToAppSaga({
      type: ReduxActionTypes.COPY_ACTION_TO_APP_INIT,
      payload: basePayload,
    });

    const delegated = gen.next().value as ReturnType<typeof call>;

    expect(typeof delegated.payload.fn).toBe("function");
    expect(delegated.payload.args).toEqual([
      basePayload,
      CopyToAppEntityType.ACTION,
      {
        actionList: ["entity-1"],
        actionCollectionList: [],
        customJsLib: [],
        datasourceList: [],
        widget: "",
      },
      ReduxActionTypes.COPY_ACTION_TO_APP_SUCCESS,
      ReduxActionErrorTypes.COPY_ACTION_TO_APP_ERROR,
    ]);
  });
});

describe("copyJSActionToAppSaga", () => {
  it("delegates with a JS-collection export body (actionCollectionList populated)", () => {
    const gen = copyJSActionToAppSaga({
      type: ReduxActionTypes.COPY_JS_ACTION_TO_APP_INIT,
      payload: basePayload,
    });

    const delegated = gen.next().value as ReturnType<typeof call>;

    expect(typeof delegated.payload.fn).toBe("function");
    expect(delegated.payload.args).toEqual([
      basePayload,
      CopyToAppEntityType.JS_OBJECT,
      {
        actionList: [],
        actionCollectionList: ["entity-1"],
        customJsLib: [],
        datasourceList: [],
        widget: "",
      },
      ReduxActionTypes.COPY_JS_ACTION_TO_APP_SUCCESS,
      ReduxActionErrorTypes.COPY_JS_ACTION_TO_APP_ERROR,
    ]);
  });
});

describe("copyEntityToApp end-to-end orchestration", () => {
  beforeEach(() => {
    toastShow.mockClear();
    logEvent.mockClear();
    basePayload.onSuccess.mockClear();
  });

  // Re-derive the shared orchestration generator from copyActionToAppSaga by
  // invoking the delegated call target with its arguments.
  function runOrchestration(): Generator {
    const outer = copyActionToAppSaga({
      type: ReduxActionTypes.COPY_ACTION_TO_APP_INIT,
      payload: basePayload,
    });
    const callEffect = outer.next().value as ReturnType<typeof call>;
    const { args, fn } = callEffect.payload as {
      args: unknown[];
      fn: (...callArgs: unknown[]) => Generator;
    };

    return fn(...args);
  }

  it("wraps the export response as a File and imports it to the target ids, then toasts success", () => {
    const gen = runOrchestration();

    // 0. determine cross-workspace via current workspace id
    expect(gen.next().value).toEqual(select(getCurrentWorkspaceId));

    // 1. select current application id (source)
    expect(gen.next("source-ws-1").value).toEqual(
      select(getCurrentApplicationId),
    );

    // 2. export the entity from the source app + page
    const exportEffect = gen.next("source-app-1").value;

    expect(exportEffect).toEqual(
      call(
        ApplicationApi.exportPartialApplication,
        "source-app-1",
        "source-page-1",
        {
          actionList: ["entity-1"],
          actionCollectionList: [],
          customJsLib: [],
          datasourceList: [],
          widget: "",
        },
      ),
    );

    // 3. validate the export response
    const exportResponse = { data: { exported: true }, responseMeta: {} };

    expect(gen.next(exportResponse).value).toEqual(
      call(validateResponse, exportResponse),
    );

    // 4. import wraps the export data in a File and targets the chosen ids
    const importEffect = gen.next(true).value as ReturnType<typeof call>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const importArgs = (importEffect.payload as any).args[0];

    expect(importEffect.payload.fn).toBe(
      ApplicationApi.importPartialApplication,
    );
    expect(importArgs.workspaceId).toBe("target-ws-1");
    expect(importArgs.applicationId).toBe("target-app-1");
    expect(importArgs.pageId).toBe("target-page-1");
    expect(importArgs.applicationFile).toBeInstanceOf(File);
    expect(importArgs.applicationFile.type).toBe("application/json");

    // 5. validate the import response
    const importResponse = { data: {}, responseMeta: {} };

    expect(gen.next(importResponse).value).toEqual(
      call(validateResponse, importResponse),
    );

    // 6. success: analytics + toast (with page name) + success action, NO navigation
    const successEffect = gen.next(true).value;

    expect(logEvent).toHaveBeenCalledWith("COPY_ENTITY_TO_APP", {
      entityType: CopyToAppEntityType.ACTION,
      isCrossWorkspace: true,
    });
    expect(toastShow).toHaveBeenCalledWith("Copied Query1 to App B / Page1", {
      kind: "success",
    });
    expect(successEffect).toEqual(
      put({ type: ReduxActionTypes.COPY_ACTION_TO_APP_SUCCESS }),
    );

    gen.next();
    expect(basePayload.onSuccess).toHaveBeenCalledTimes(1);
    expect(gen.next().done).toBe(true);
  });

  it("dispatches the error action (resetting isCopying) when the export response is invalid", () => {
    const gen = runOrchestration();

    gen.next(); // select workspace id
    gen.next("source-ws-1"); // select application id
    gen.next("source-app-1"); // export call
    gen.next({ data: null, responseMeta: {} }); // validateResponse call

    // invalid export -> dispatch the error action (which resets isCopying) and
    // stop, without importing or toasting. `show: false` avoids a duplicate toast.
    expect(gen.next(false).value).toEqual(
      put({
        type: ReduxActionErrorTypes.COPY_ACTION_TO_APP_ERROR,
        payload: { show: false },
      }),
    );
    expect(gen.next().done).toBe(true);
    expect(toastShow).not.toHaveBeenCalled();
    expect(logEvent).not.toHaveBeenCalled();
  });

  it("dispatches the error action (resetting isCopying) when the import response is invalid", () => {
    const gen = runOrchestration();

    gen.next(); // select workspace id
    gen.next("source-ws-1"); // select application id
    gen.next("source-app-1"); // export call
    gen.next({ data: { exported: true }, responseMeta: {} }); // validateResponse(export)
    gen.next(true); // import call
    gen.next({ data: {}, responseMeta: {} }); // validateResponse(import)

    // invalid import -> dispatch the error action (which resets isCopying) and
    // stop before toast/success. `show: false` avoids a duplicate toast.
    expect(gen.next(false).value).toEqual(
      put({
        type: ReduxActionErrorTypes.COPY_ACTION_TO_APP_ERROR,
        payload: { show: false },
      }),
    );
    expect(gen.next().done).toBe(true);
    expect(toastShow).not.toHaveBeenCalled();
    expect(logEvent).not.toHaveBeenCalled();
    expect(basePayload.onSuccess).not.toHaveBeenCalled();
  });

  it("dispatches the error action with an error toast when import throws", () => {
    const gen = runOrchestration();

    gen.next(); // select workspace id
    gen.next("source-ws-1"); // select application id
    gen.next("source-app-1"); // export call
    gen.next({ data: { exported: true }, responseMeta: {} }); // validateResponse(export)
    gen.next(true); // import call

    // import throws -> caught -> analytics(error) + error action with show+message
    const errorEffect = gen.throw(new Error("network down"));
    const errorAction = (
      errorEffect.value as {
        payload: {
          action: {
            type: string;
            payload: { show: boolean; error: { message: string } };
          };
        };
      }
    ).payload.action;

    expect(logEvent).toHaveBeenCalledWith("COPY_ENTITY_TO_APP", {
      entityType: CopyToAppEntityType.ACTION,
      isCrossWorkspace: true,
      error: true,
    });
    expect(errorAction.type).toBe(
      ReduxActionErrorTypes.COPY_ACTION_TO_APP_ERROR,
    );
    expect(errorAction.payload.show).toBe(true);
    expect(errorAction.payload.error.message).toBe(
      "Failed to copy to the selected application",
    );
    expect(basePayload.onSuccess).not.toHaveBeenCalled();
  });
});

describe("fetchAppsForCopyTargetSaga", () => {
  it("fetches applications for the workspace and stores them in the copyEntityToApp slice", () => {
    const gen: Generator = fetchAppsForCopyTargetSaga({
      type: ReduxActionTypes.FETCH_COPY_TARGET_APPLICATIONS_INIT,
      payload: { workspaceId: "ws-9" },
    });

    expect(gen.next().value).toEqual(
      call(ApplicationApi.fetchAllApplicationsOfWorkspace, "ws-9"),
    );

    const response = { data: [{ id: "app-1" }], responseMeta: {} };

    expect(gen.next(response).value).toEqual(call(validateResponse, response));

    expect(gen.next(true).value).toEqual(
      put({
        type: ReduxActionTypes.FETCH_COPY_TARGET_APPLICATIONS_SUCCESS,
        payload: { applications: [{ id: "app-1" }] },
      }),
    );

    expect(gen.next().done).toBe(true);
  });

  it("dispatches the error action (clearing the loading state) when the response is invalid", () => {
    const gen: Generator = fetchAppsForCopyTargetSaga({
      type: ReduxActionTypes.FETCH_COPY_TARGET_APPLICATIONS_INIT,
      payload: { workspaceId: "ws-9" },
    });

    gen.next(); // fetch call
    gen.next({ data: null, responseMeta: {} }); // validateResponse call

    // invalid response (validateResponse returned false) -> dispatch the error
    // action so isFetchingApplications is reset. show: false avoids a duplicate toast.
    expect(gen.next(false).value).toEqual(
      put({
        type: ReduxActionErrorTypes.FETCH_COPY_TARGET_APPLICATIONS_ERROR,
        payload: { show: false },
      }),
    );
    expect(gen.next().done).toBe(true);
  });

  it("dispatches the error action with the thrown error when the fetch throws", () => {
    const gen: Generator = fetchAppsForCopyTargetSaga({
      type: ReduxActionTypes.FETCH_COPY_TARGET_APPLICATIONS_INIT,
      payload: { workspaceId: "ws-9" },
    });

    gen.next(); // fetch call
    const error = new Error("network down");

    // thrown failure (validateResponse throws or fetch rejects) -> caught and
    // surfaced via the error action with the error payload (toast shown).
    expect(gen.throw(error).value).toEqual(
      put({
        type: ReduxActionErrorTypes.FETCH_COPY_TARGET_APPLICATIONS_ERROR,
        payload: { error },
      }),
    );
    expect(gen.next().done).toBe(true);
  });
});

describe("fetchPagesForCopyTargetSaga", () => {
  it("fetches named pages for the target app and stores them in the slice", () => {
    const gen: Generator = fetchPagesForCopyTargetSaga({
      type: ReduxActionTypes.FETCH_COPY_TARGET_PAGES_INIT,
      payload: { applicationId: "app-9" },
    });

    expect(gen.next().value).toEqual(
      call(PageApi.fetchAppAndPages, {
        applicationId: "app-9",
        mode: APP_MODE.EDIT,
      }),
    );

    const response = {
      data: { pages: [{ id: "pg-1", name: "Page1" }] },
      responseMeta: {},
    };

    expect(gen.next(response).value).toEqual(call(validateResponse, response));

    expect(gen.next(true).value).toEqual(
      put({
        type: ReduxActionTypes.FETCH_COPY_TARGET_PAGES_SUCCESS,
        payload: { pages: [{ id: "pg-1", name: "Page1" }] },
      }),
    );

    expect(gen.next().done).toBe(true);
  });

  it("dispatches the error action (clearing the loading state) when the response is invalid", () => {
    const gen: Generator = fetchPagesForCopyTargetSaga({
      type: ReduxActionTypes.FETCH_COPY_TARGET_PAGES_INIT,
      payload: { applicationId: "app-9" },
    });

    gen.next(); // fetch call
    gen.next({ data: null, responseMeta: {} }); // validateResponse call

    // invalid response (validateResponse returned false) -> dispatch the error
    // action so isFetchingPages is reset. show: false avoids a duplicate toast.
    expect(gen.next(false).value).toEqual(
      put({
        type: ReduxActionErrorTypes.FETCH_COPY_TARGET_PAGES_ERROR,
        payload: { show: false },
      }),
    );
    expect(gen.next().done).toBe(true);
  });

  it("dispatches the error action with the thrown error when the fetch throws", () => {
    const gen: Generator = fetchPagesForCopyTargetSaga({
      type: ReduxActionTypes.FETCH_COPY_TARGET_PAGES_INIT,
      payload: { applicationId: "app-9" },
    });

    gen.next(); // fetch call
    const error = new Error("network down");

    // thrown failure -> caught and surfaced via the error action (toast shown).
    expect(gen.throw(error).value).toEqual(
      put({
        type: ReduxActionErrorTypes.FETCH_COPY_TARGET_PAGES_ERROR,
        payload: { error },
      }),
    );
    expect(gen.next().done).toBe(true);
  });
});
