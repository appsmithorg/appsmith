import type { ReduxAction } from "actions/ReduxActionTypes";
import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";
import { ENTITY_TYPE } from "ee/entities/AppsmithConsole/utils";
import { setDataUrl } from "ee/sagas/PageSagas";
import { getAppMode } from "ee/selectors/applicationSelectors";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";
import { APP_MODE } from "entities/App";
import type { Page } from "entities/Page";
import { expectSaga } from "redux-saga-test-plan";
import { call, put, select, take } from "redux-saga/effects";
import navigateActionSaga, {
  navigateToAnyPageInApplication,
  pushToHistory,
} from "sagas/ActionExecution/NavigateActionSaga";
import type { NavigateToAnotherPagePayload } from "sagas/ActionExecution/NavigateActionSaga/types";
import { TriggerFailureError } from "sagas/ActionExecution/errorUtils";
import { getCurrentPageId, getPageList } from "selectors/editorSelectors";
import AppsmithConsole from "utils/AppsmithConsole";
import history, { NavigationMethod } from "utils/history";
import type { TNavigateToDescription } from "workers/Evaluation/fns/navigateTo";
import { NavigationTargetType } from "workers/Evaluation/fns/navigateTo";

// Mock worker global functions
const mockWindowOpen = jest.fn();
const mockWindowLocationAssign = jest.fn();

Object.defineProperty(window, "open", {
  value: mockWindowOpen,
  writable: true,
});
Object.defineProperty(window, "location", {
  value: { assign: mockWindowLocationAssign },
  writable: true,
});

jest.mock("ee/utils/AnalyticsUtil");
jest.mock("utils/AppsmithConsole");
jest.mock("ee/sagas/PageSagas");
jest.mock("utils/history");
jest.mock("ee/RouteBuilder", () => ({
  builderURL: jest.fn(({ basePageId, params }) => {
    let url = `/builder/${basePageId}`;

    if (params) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const queryString = new URLSearchParams(params as any).toString();

      if (queryString) url += `?${queryString}`;
    }

    return url;
  }),
  viewerURL: jest.fn(({ basePageId, params }) => {
    let url = `/viewer/${basePageId}`;

    if (params) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const queryString = new URLSearchParams(params as any).toString();

      if (queryString) url += `?${queryString}`;
    }

    return url;
  }),
}));

const MOCK_PAGE_LIST: Page[] = [
  { pageId: "page1", pageName: "Page1", basePageId: "basePage1" } as Page,
  { pageId: "page2", pageName: "Page2", basePageId: "basePage2" } as Page,
];

const MOCK_SOURCE_ENTITY = {
  id: "widgetId",
  name: "Button1",
  type: ENTITY_TYPE.WIDGET,
};

describe("NavigateActionSaga", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("navigateActionSaga", () => {
    const basePayload: TNavigateToDescription["payload"] = {
      pageNameOrUrl: "Page1",
      params: {},
      target: NavigationTargetType.SAME_WINDOW,
    };

    it("should navigate to a page in the same window (EDIT mode)", async () => {
      const action: TNavigateToDescription = {
        type: "NAVIGATE_TO",
        payload: basePayload,
      };

      return expectSaga(navigateActionSaga, action, MOCK_SOURCE_ENTITY)
        .provide([
          [select(getPageList), MOCK_PAGE_LIST],
          [select(getCurrentPageId), "page2"],
          [select(getAppMode), APP_MODE.EDIT],
          [call(pushToHistory, "/builder/basePage1"), undefined], // Mock pushToHistory
        ])
        .call(pushToHistory, "/builder/basePage1")
        .run()
        .then(() => {
          expect(AnalyticsUtil.logEvent).toHaveBeenCalledWith("NAVIGATE", {
            pageName: "Page1",
            pageParams: {},
          });
          expect(AppsmithConsole.info).toHaveBeenCalledWith(
            expect.objectContaining({
              text: "navigateTo triggered",
              source: MOCK_SOURCE_ENTITY,
            }),
          );
        });
    });

    it("should navigate to a page in a new window (VIEW mode)", async () => {
      const action: TNavigateToDescription = {
        type: "NAVIGATE_TO",
        payload: {
          ...basePayload,
          target: NavigationTargetType.NEW_WINDOW,
        },
      };

      return expectSaga(navigateActionSaga, action)
        .provide([
          [select(getPageList), MOCK_PAGE_LIST],
          [select(getCurrentPageId), "page2"],
          [select(getAppMode), APP_MODE.PUBLISHED],
        ])
        .run()
        .then(() => {
          expect(mockWindowOpen).toHaveBeenCalledWith(
            "/viewer/basePage1",
            "_blank",
          );
          expect(AnalyticsUtil.logEvent).toHaveBeenCalled();
        });
    });

    it("should navigate to the current page and trigger re-evaluation", async () => {
      const action: TNavigateToDescription = {
        type: "NAVIGATE_TO",
        payload: { ...basePayload, pageNameOrUrl: "Page1" }, // current page
      };

      return expectSaga(navigateActionSaga, action)
        .provide([
          [select(getPageList), MOCK_PAGE_LIST],
          [select(getCurrentPageId), "page1"], // Current page is page1
          [select(getAppMode), APP_MODE.EDIT],
          [call(pushToHistory, "/builder/basePage1"), undefined],
          [call(setDataUrl), undefined],
        ])
        .put({ type: ReduxActionTypes.TRIGGER_EVAL })
        .call(setDataUrl)
        .run();
    });

    it("should navigate to an external URL in the same window", async () => {
      const action: TNavigateToDescription = {
        type: "NAVIGATE_TO",
        payload: {
          pageNameOrUrl: "www.google.com",
          params: { q: "test" },
          target: NavigationTargetType.SAME_WINDOW,
        },
      };

      return expectSaga(navigateActionSaga, action)
        .provide([[select(getPageList), MOCK_PAGE_LIST]])
        .run()
        .then(() => {
          expect(mockWindowLocationAssign).toHaveBeenCalledWith(
            "https://www.google.com?q=test",
          );
          expect(AnalyticsUtil.logEvent).toHaveBeenCalledWith("NAVIGATE", {
            navUrl: "www.google.com",
          });
        });
    });

    it("should navigate to an external URL (with https) in a new window", async () => {
      const action: TNavigateToDescription = {
        type: "NAVIGATE_TO",
        payload: {
          pageNameOrUrl: "https://appsmith.com",
          params: {},
          target: NavigationTargetType.NEW_WINDOW,
        },
      };

      return expectSaga(navigateActionSaga, action)
        .provide([[select(getPageList), MOCK_PAGE_LIST]])
        .run()
        .then(() => {
          expect(mockWindowOpen).toHaveBeenCalledWith(
            "https://appsmith.com",
            "_blank",
          );
        });
    });

    it("should throw TriggerFailureError for invalid URL", async () => {
      const action: TNavigateToDescription = {
        type: "NAVIGATE_TO",
        payload: {
          pageNameOrUrl: "invalid-url-that-does-not-exist",
          params: {},
          target: NavigationTargetType.SAME_WINDOW,
        },
      };

      return expectSaga(navigateActionSaga, action)
        .provide([[select(getPageList), MOCK_PAGE_LIST]])
        .run()
        .catch((e) => {
          expect(e).toBeInstanceOf(TriggerFailureError);
          expect(e.message).toBe("Enter a valid URL or page name");
        });
    });

    it("should navigate to page with query params", async () => {
      const params = { key1: "value1", key2: "value2" };
      const action: TNavigateToDescription = {
        type: "NAVIGATE_TO",
        payload: { ...basePayload, params },
      };

      return expectSaga(navigateActionSaga, action)
        .provide([
          [select(getPageList), MOCK_PAGE_LIST],
          [select(getCurrentPageId), "page2"],
          [select(getAppMode), APP_MODE.EDIT],
          [
            call(pushToHistory, {
              pageURL: "/builder/basePage1?key1=value1&key2=value2",
              query: "key1=value1&key2=value2",
              state: {},
            }),
            undefined,
          ],
        ])
        .run();
    });
  });

  describe("pushToHistory", () => {
    const payload: NavigateToAnotherPagePayload = {
      pageURL: "/app/page-1",
      query: "param=value",
      state: {},
    };

    const onPageUnloadActionsCompletionPattern = [
      ReduxActionTypes.EXECUTE_PAGE_UNLOAD_ACTIONS_SUCCESS,
      ReduxActionTypes.EXECUTE_PAGE_UNLOAD_ACTIONS_ERROR,
    ];

    describe("with payload", () => {
      it("should dispatch EXECUTE_PAGE_UNLOAD_ACTIONS and wait for success", async () => {
        return expectSaga(pushToHistory, payload)
          .provide([
            [put({ type: ReduxActionTypes.EXECUTE_PAGE_UNLOAD_ACTIONS }), true],
            [
              take(onPageUnloadActionsCompletionPattern),
              { type: ReduxActionTypes.EXECUTE_PAGE_UNLOAD_ACTIONS_SUCCESS },
            ],
          ])
          .run()
          .then(() => {
            expect(history.push).toHaveBeenCalledWith({
              pathname: "/app/page-1",
              search: "param=value",
              state: {},
            });
          });
      });

      it("should dispatch EXECUTE_PAGE_UNLOAD_ACTIONS and wait for error", async () => {
        return expectSaga(pushToHistory, payload)
          .provide([
            [put({ type: ReduxActionTypes.EXECUTE_PAGE_UNLOAD_ACTIONS }), true],
            [
              take(onPageUnloadActionsCompletionPattern),
              { type: ReduxActionTypes.EXECUTE_PAGE_UNLOAD_ACTIONS_ERROR },
            ],
          ])
          .run()
          .then(() => {
            expect(history.push).toHaveBeenCalledWith({
              pathname: "/app/page-1",
              search: "param=value",
              state: {},
            });
          });
      });

      it("should call history.push with state if provided", async () => {
        const payloadWithState: NavigateToAnotherPagePayload = {
          ...payload,
          state: { invokedBy: NavigationMethod.AppNavigation },
        };

        return expectSaga(pushToHistory, payloadWithState)
          .provide([
            [put({ type: ReduxActionTypes.EXECUTE_PAGE_UNLOAD_ACTIONS }), true],
            [
              take(onPageUnloadActionsCompletionPattern),
              { type: ReduxActionTypes.EXECUTE_PAGE_UNLOAD_ACTIONS_SUCCESS },
            ],
          ])
          .run()
          .then(() => {
            expect(history.push).toHaveBeenCalledWith({
              pathname: "/app/page-1",
              search: "param=value",
              state: { invokedBy: NavigationMethod.AppNavigation },
            });
          });
      });
    });

    describe("with string parameter", () => {
      it("should dispatch EXECUTE_PAGE_UNLOAD_ACTIONS and wait for success with string path", async () => {
        const stringPath = "/app/simple-page";

        return expectSaga(pushToHistory, stringPath)
          .provide([
            [put({ type: ReduxActionTypes.EXECUTE_PAGE_UNLOAD_ACTIONS }), true],
            [
              take(onPageUnloadActionsCompletionPattern),
              { type: ReduxActionTypes.EXECUTE_PAGE_UNLOAD_ACTIONS_SUCCESS },
            ],
          ])
          .run()
          .then(() => {
            expect(history.push).toHaveBeenCalledWith(stringPath);
          });
      });

      it("should dispatch EXECUTE_PAGE_UNLOAD_ACTIONS and wait for error with string path", async () => {
        const stringPath = "/app/another-page";

        return expectSaga(pushToHistory, stringPath)
          .provide([
            [put({ type: ReduxActionTypes.EXECUTE_PAGE_UNLOAD_ACTIONS }), true],
            [
              take(onPageUnloadActionsCompletionPattern),
              { type: ReduxActionTypes.EXECUTE_PAGE_UNLOAD_ACTIONS_ERROR },
            ],
          ])
          .run()
          .then(() => {
            expect(history.push).toHaveBeenCalledWith(stringPath);
          });
      });

      it("should handle string path with query parameters", async () => {
        const stringPathWithQuery = "/app/page?param1=value1&param2=value2";

        return expectSaga(pushToHistory, stringPathWithQuery)
          .provide([
            [put({ type: ReduxActionTypes.EXECUTE_PAGE_UNLOAD_ACTIONS }), true],
            [
              take(onPageUnloadActionsCompletionPattern),
              { type: ReduxActionTypes.EXECUTE_PAGE_UNLOAD_ACTIONS_SUCCESS },
            ],
          ])
          .run()
          .then(() => {
            expect(history.push).toHaveBeenCalledWith(stringPathWithQuery);
          });
      });

      it("should handle root path string", async () => {
        const rootPath = "/";

        return expectSaga(pushToHistory, rootPath)
          .provide([
            [put({ type: ReduxActionTypes.EXECUTE_PAGE_UNLOAD_ACTIONS }), true],
            [
              take(onPageUnloadActionsCompletionPattern),
              { type: ReduxActionTypes.EXECUTE_PAGE_UNLOAD_ACTIONS_SUCCESS },
            ],
          ])
          .run()
          .then(() => {
            expect(history.push).toHaveBeenCalledWith(rootPath);
          });
      });

      it("should handle empty string path", async () => {
        const emptyPath = "";

        return expectSaga(pushToHistory, emptyPath)
          .provide([
            [put({ type: ReduxActionTypes.EXECUTE_PAGE_UNLOAD_ACTIONS }), true],
            [
              take(onPageUnloadActionsCompletionPattern),
              { type: ReduxActionTypes.EXECUTE_PAGE_UNLOAD_ACTIONS_SUCCESS },
            ],
          ])
          .run()
          .then(() => {
            expect(history.push).toHaveBeenCalledWith(emptyPath);
          });
      });
    });
  });

  describe("navigateToAnyPageInApplication", () => {
    it("should call pushToHistory with the given payload", async () => {
      const payload: NavigateToAnotherPagePayload = {
        pageURL: "/app/my-page",
        query: "test=1",
        state: {},
      };
      const action: ReduxAction<NavigateToAnotherPagePayload> = {
        type: "NAVIGATE_TO_PAGE", // Mock action type
        payload,
      };

      return expectSaga(navigateToAnyPageInApplication, action)
        .provide([[call(pushToHistory, payload), undefined]])
        .call(pushToHistory, payload)
        .run();
    });
  });
});
