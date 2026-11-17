import { call, put, select } from "redux-saga/effects";
import ApplicationApi from "ee/api/ApplicationApi";
import {
  ReduxActionErrorTypes,
  ReduxActionTypes,
} from "ee/constants/ReduxActionConstants";
import {
  AXIOS_CONNECTION_ABORTED_CODE,
  ERROR_CODES,
} from "ee/constants/ApiConstants";
import { FAVORITES_KEY } from "ee/constants/workspaceConstants";
import { getCurrentApplication } from "ee/selectors/applicationSelectors";
import {
  getApplicationsOfWorkspace,
  getCurrentWorkspaceId,
} from "ee/selectors/selectedWorkspaceSelectors";
import { validateResponse } from "sagas/ErrorSagas";
import { deleteRecentAppEntities } from "utils/storage";
import {
  deleteApplicationSaga,
  isApplicationPresentInHomeList,
  recoverDeleteApplicationIfAlreadyGone,
  resolveDeleteApplicationRecoveryContext,
  shouldRecoverDeleteApplicationFromError,
} from "./ApplicationSagas";

jest.mock("sagas/ErrorSagas", () => ({
  validateResponse: jest.fn(),
}));

jest.mock("utils/storage", () => ({
  deleteRecentAppEntities: jest.fn(),
  getEnableStartSignposting: jest.fn(),
}));

jest.mock("ee/utils/AnalyticsUtil", () => ({
  __esModule: true,
  default: {
    logEvent: jest.fn(),
  },
}));

// Saga next()/throw() typing is too narrow for step-through unit tests.
type TestSaga = Generator<unknown, unknown, unknown>;

describe("shouldRecoverDeleteApplicationFromError", () => {
  it("returns true for request timeout", () => {
    expect(
      shouldRecoverDeleteApplicationFromError({
        code: ERROR_CODES.REQUEST_TIMEOUT,
      }),
    ).toBe(true);
  });

  it("returns true for aborted connection", () => {
    expect(
      shouldRecoverDeleteApplicationFromError({
        code: AXIOS_CONNECTION_ABORTED_CODE,
      }),
    ).toBe(true);
  });

  it("returns true for resource-not-found server codes", () => {
    expect(
      shouldRecoverDeleteApplicationFromError({ code: "AE-APP-4013" }),
    ).toBe(true);
  });

  it("returns true for network errors", () => {
    expect(
      shouldRecoverDeleteApplicationFromError({ message: "Network Error" }),
    ).toBe(true);
  });

  it("returns false for unrelated errors", () => {
    expect(
      shouldRecoverDeleteApplicationFromError({
        code: ERROR_CODES.REQUEST_FORBIDDEN,
        message: "Forbidden",
      }),
    ).toBe(false);
  });
});

describe("isApplicationPresentInHomeList", () => {
  it("matches the deleted id directly", () => {
    expect(
      isApplicationPresentInHomeList(
        [{ id: "app-1", baseId: "app-1" }],
        "app-1",
        "app-1",
      ),
    ).toBe(true);
  });

  it("matches a Git base row when the deleted id was a branch application", () => {
    expect(
      isApplicationPresentInHomeList(
        [{ id: "base-1", baseId: "base-1" }],
        "branch-9",
        "base-1",
      ),
    ).toBe(true);
  });

  it("returns false when neither the branch nor base id is listed", () => {
    expect(
      isApplicationPresentInHomeList(
        [{ id: "other", baseId: "other" }],
        "branch-9",
        "base-1",
      ),
    ).toBe(false);
  });
});

describe("resolveDeleteApplicationRecoveryContext", () => {
  it("prefers the current application workspace and base id", () => {
    const gen: TestSaga = resolveDeleteApplicationRecoveryContext("branch-1");

    expect(gen.next().value).toEqual(select(getCurrentApplication));
    expect(
      gen.next({
        id: "branch-1",
        workspaceId: "ws-from-editor",
        baseId: "base-1",
      }).value,
    ).toEqual({
      workspaceId: "ws-from-editor",
      baseApplicationId: "base-1",
    });
    expect(gen.next().done).toBe(true);
  });

  it("falls back to the workspace app list", () => {
    const gen: TestSaga = resolveDeleteApplicationRecoveryContext("app-1");

    expect(gen.next().value).toEqual(select(getCurrentApplication));
    expect(gen.next(undefined).value).toEqual(
      select(getApplicationsOfWorkspace),
    );
    expect(
      gen.next([{ id: "app-1", workspaceId: "ws-from-list", baseId: "app-1" }])
        .value,
    ).toEqual({
      workspaceId: "ws-from-list",
      baseApplicationId: "app-1",
    });
    expect(gen.next().done).toBe(true);
  });

  it("ignores favorites as a workspace id fallback", () => {
    const gen: TestSaga = resolveDeleteApplicationRecoveryContext("app-1");

    gen.next();
    gen.next(undefined);
    expect(gen.next([]).value).toEqual(select(getCurrentWorkspaceId));
    expect(gen.next(FAVORITES_KEY).value).toEqual({
      workspaceId: undefined,
      baseApplicationId: undefined,
    });
    expect(gen.next().done).toBe(true);
  });
});

describe("recoverDeleteApplicationIfAlreadyGone", () => {
  const recoveryContext = {
    workspaceId: "ws-1",
    baseApplicationId: "base-1",
  };

  it("does not recover when the Git base app is still on /home after a branch delete", () => {
    const gen: TestSaga = recoverDeleteApplicationIfAlreadyGone(
      "branch-9",
      { code: ERROR_CODES.REQUEST_TIMEOUT },
      recoveryContext,
    );

    expect(gen.next().value).toEqual(
      call(ApplicationApi.fetchAllApplicationsOfWorkspace, "ws-1"),
    );

    const response = {
      data: [{ id: "base-1", baseId: "base-1", pages: [] }],
      responseMeta: { success: true },
    };

    expect(gen.next(response).value).toEqual(call(validateResponse, response));
    expect(gen.next(true).value).toBe(false);
    expect(gen.next().done).toBe(true);
  });

  it("recovers when neither branch nor base id remains on /home", () => {
    const gen: TestSaga = recoverDeleteApplicationIfAlreadyGone(
      "branch-9",
      { code: ERROR_CODES.REQUEST_TIMEOUT },
      recoveryContext,
    );

    gen.next();
    gen.next({
      data: [{ id: "other-app", baseId: "other-app", pages: [] }],
      responseMeta: { success: true },
    });
    expect(gen.next(true).value).toEqual(select(getCurrentWorkspaceId));
    expect(gen.next("ws-1").value).toEqual(
      put({
        type: ReduxActionTypes.FETCH_ALL_APPLICATIONS_OF_WORKSPACE_SUCCESS,
        payload: [
          {
            id: "other-app",
            baseId: "other-app",
            pages: [],
            defaultPageId: undefined,
            defaultBasePageId: undefined,
          },
        ],
      }),
    );
    expect(gen.next().value).toEqual(
      put({
        type: ReduxActionTypes.DELETE_APPLICATION_SUCCESS,
        payload: { id: "base-1" },
      }),
    );
    expect(gen.next().value).toEqual(call(deleteRecentAppEntities, "branch-9"));
    expect(gen.next().value).toEqual(call(deleteRecentAppEntities, "base-1"));
    expect(gen.next().value).toBe(true);
    expect(gen.next().done).toBe(true);
  });

  it("does not overwrite the app list when the selected workspace changed", () => {
    const gen: TestSaga = recoverDeleteApplicationIfAlreadyGone(
      "app-1",
      { code: ERROR_CODES.REQUEST_TIMEOUT },
      { workspaceId: "ws-deleted-from", baseApplicationId: "app-1" },
    );

    gen.next();
    gen.next({
      data: [{ id: "other-app", pages: [] }],
      responseMeta: { success: true },
    });
    gen.next(true);
    expect(gen.next("ws-other").value).toEqual(
      put({
        type: ReduxActionTypes.DELETE_APPLICATION_SUCCESS,
        payload: { id: "app-1" },
      }),
    );
    expect(gen.next().value).toEqual(call(deleteRecentAppEntities, "app-1"));
    expect(gen.next().value).toBe(true);
  });

  it("returns false without refetching when workspace id is missing", () => {
    const gen: TestSaga = recoverDeleteApplicationIfAlreadyGone(
      "app-1",
      { code: ERROR_CODES.REQUEST_TIMEOUT },
      { workspaceId: undefined, baseApplicationId: "app-1" },
    );

    expect(gen.next().value).toBe(false);
    expect(gen.next().done).toBe(true);
  });

  it("returns false without refetching for non-recovery errors", () => {
    const gen: TestSaga = recoverDeleteApplicationIfAlreadyGone(
      "app-1",
      { code: ERROR_CODES.REQUEST_FORBIDDEN },
      recoveryContext,
    );

    expect(gen.next().value).toBe(false);
    expect(gen.next().done).toBe(true);
  });
});

describe("deleteApplicationSaga", () => {
  it("emits DELETE_APPLICATION_ERROR when recovery fails", () => {
    const action = {
      type: ReduxActionTypes.DELETE_APPLICATION_INIT,
      payload: { applicationId: "app-1" },
    };
    const gen: TestSaga = deleteApplicationSaga(action);
    const error = { code: ERROR_CODES.REQUEST_FORBIDDEN };
    const recoveryContext = {
      workspaceId: "ws-1",
      baseApplicationId: "app-1",
    };

    expect(gen.next().value).toEqual(
      call(resolveDeleteApplicationRecoveryContext, "app-1"),
    );
    expect(gen.next(recoveryContext).value).toEqual(
      call(ApplicationApi.deleteApplication, action.payload),
    );
    expect(gen.throw(error).value).toEqual(
      call(
        recoverDeleteApplicationIfAlreadyGone,
        "app-1",
        error,
        recoveryContext,
      ),
    );
    expect(gen.next(false).value).toEqual(
      put({
        type: ReduxActionErrorTypes.DELETE_APPLICATION_ERROR,
        payload: { error },
      }),
    );
    expect(gen.next().done).toBe(true);
  });

  it("skips DELETE_APPLICATION_ERROR when recovery succeeds", () => {
    const action = {
      type: ReduxActionTypes.DELETE_APPLICATION_INIT,
      payload: { applicationId: "branch-9" },
    };
    const gen: TestSaga = deleteApplicationSaga(action);
    const error = { code: ERROR_CODES.REQUEST_TIMEOUT };
    const recoveryContext = {
      workspaceId: "ws-1",
      baseApplicationId: "base-1",
    };

    expect(gen.next().value).toEqual(
      call(resolveDeleteApplicationRecoveryContext, "branch-9"),
    );
    expect(gen.next(recoveryContext).value).toEqual(
      call(ApplicationApi.deleteApplication, action.payload),
    );
    expect(gen.throw(error).value).toEqual(
      call(
        recoverDeleteApplicationIfAlreadyGone,
        "branch-9",
        error,
        recoveryContext,
      ),
    );
    expect(gen.next(true).done).toBe(true);
  });
});
