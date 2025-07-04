import type { ReduxAction } from "actions/ReduxActionTypes";
import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";
import { getQueryStringfromObject } from "ee/entities/URLRedirect/URLAssembly";
import { builderURL, viewerURL } from "ee/RouteBuilder";
import { setDataUrl } from "ee/sagas/PageSagas";
import { getAppMode } from "ee/selectors/applicationSelectors";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";
import { APP_MODE } from "entities/App";
import type { SourceEntity } from "entities/AppsmithConsole";
import type { Page } from "entities/Page";
import _ from "lodash";
import { call, put, select, take } from "redux-saga/effects";
import { getCurrentPageId, getPageList } from "selectors/editorSelectors";
import AppsmithConsole from "utils/AppsmithConsole";
import history, { type AppsmithLocationState } from "utils/history";
import { isValidURL, matchesURLPattern } from "utils/URLUtils";
import type { TNavigateToDescription } from "workers/Evaluation/fns/navigateTo";
import { NavigationTargetType } from "workers/Evaluation/fns/navigateTo";
import { TriggerFailureError } from "../errorUtils";
import type { NavigateToAnotherPagePayload } from "./types";
import type { LocationDescriptor, Path } from "history";

const isValidPageName = (
  pageNameOrUrl: string,
  pageList: Page[],
): Page | undefined => {
  return _.find(pageList, (page: Page) => page.pageName === pageNameOrUrl);
};

export default function* navigateActionSaga(
  action: TNavigateToDescription,
  source?: SourceEntity,
) {
  const { payload } = action;
  const pageList: Page[] = yield select(getPageList);
  const { pageNameOrUrl, params, target } = payload;

  const page = isValidPageName(pageNameOrUrl, pageList);

  if (page) {
    const currentPageId: string = yield select(getCurrentPageId);

    AnalyticsUtil.logEvent("NAVIGATE", {
      pageName: pageNameOrUrl,
      pageParams: params,
    });

    const appMode: APP_MODE = yield select(getAppMode);
    const urlBuilder = appMode === APP_MODE.EDIT ? builderURL : viewerURL;
    const path = urlBuilder({
      basePageId: page.basePageId,
      params,
    });

    if (target === NavigationTargetType.SAME_WINDOW) {
      yield call(pushToHistory, path);

      if (currentPageId === page.pageId) {
        yield call(setDataUrl);
        yield put({
          type: ReduxActionTypes.TRIGGER_EVAL,
        });
      }
    } else if (target === NavigationTargetType.NEW_WINDOW) {
      window.open(path, "_blank");
    }

    AppsmithConsole.info({
      source,
      text: `navigateTo triggered`,
      state: {
        page,
        params,
      },
    });
  } else {
    let url = pageNameOrUrl + getQueryStringfromObject(params);

    if (!isValidURL(url)) {
      const looksLikeURL = matchesURLPattern(url);

      // Filter out cases like navigateTo("1");
      if (!looksLikeURL)
        throw new TriggerFailureError("Enter a valid URL or page name");

      // Default to https protocol to support navigation to URLs like www.google.com
      url = `https://${url}`;

      if (!isValidURL(url))
        throw new TriggerFailureError("Enter a valid URL or page name");
    }

    if (target === NavigationTargetType.SAME_WINDOW) {
      window.location.assign(url);
    } else if (target === NavigationTargetType.NEW_WINDOW) {
      window.open(url, "_blank");
    }

    AppsmithConsole.info({
      text: `navigateTo('${url}') was triggered`,
      state: {
        params,
      },
    });
    AnalyticsUtil.logEvent("NAVIGATE", {
      navUrl: pageNameOrUrl,
    });
  }
}

export function* navigateToAnyPageInApplication(
  action: ReduxAction<NavigateToAnotherPagePayload>,
) {
  yield call(pushToHistory, action.payload);
}

/**
 * Pushes navigation state to browser history after executing page unload actions.
 *
 * This function handles three different variants of history.push() calls to maintain
 * backward compatibility with existing code patterns:
 *
 * 1. String payload: Direct path navigation without query or state
 *    - Uses: history.push(path)
 *
 * 2. Payload with state but no query: Navigation with state object
 *    - Uses: history.push(pageURL, state)
 *
 * 3. Payload with query and/or state: Full navigation with all parameters
 *    - Uses: history.push({ pathname, search, state })
 *
 * These variants exist to conform to how the code was working previously and
 * ensure consistent behavior across different navigation scenarios.
 */
export function* pushToHistory(payload: NavigateToAnotherPagePayload | Path) {
  yield put({
    type: ReduxActionTypes.EXECUTE_PAGE_UNLOAD_ACTIONS,
  });

  yield take([
    ReduxActionTypes.EXECUTE_PAGE_UNLOAD_ACTIONS_SUCCESS,
    ReduxActionTypes.EXECUTE_PAGE_UNLOAD_ACTIONS_ERROR,
  ]);

  if (typeof payload === "string") {
    history.push(payload);

    return;
  }

  if (!payload.query && payload.state) {
    history.push(payload.pageURL, payload.state);

    return;
  }

  const historyState: LocationDescriptor<AppsmithLocationState> = {
    pathname: payload.pageURL,
    search: payload.query,
    state: payload.state,
  };

  history.push(historyState);
}
