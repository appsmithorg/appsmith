import { call, put, select } from "redux-saga/effects";
import { getCurrentPageId, getPageList } from "selectors/editorSelectors";
import _ from "lodash";
import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";
import type { Page } from "entities/Page";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";
import { getAppMode } from "ee/selectors/applicationSelectors";
import { APP_MODE } from "entities/App";
import { getQueryStringfromObject } from "ee/entities/URLRedirect/URLAssembly";
import history from "utils/history";
import { setDataUrl } from "ee/sagas/PageSagas";
import AppsmithConsole from "utils/AppsmithConsole";
import { builderURL, viewerURL } from "ee/RouteBuilder";
import { TriggerFailureError } from "./errorUtils";
import { isValidURL, matchesURLPattern } from "utils/URLUtils";
import type { TNavigateToDescription } from "workers/Evaluation/fns/navigateTo";
import { NavigationTargetType } from "workers/Evaluation/fns/navigateTo";

export enum NavigationTargetType_Dep {
  SAME_WINDOW = "SAME_WINDOW",
  NEW_WINDOW = "NEW_WINDOW",
}

const isValidPageName = (
  pageNameOrUrl: string,
  pageList: Page[],
): Page | undefined => {
  return _.find(pageList, (page: Page) => page.pageName === pageNameOrUrl);
};

export default function* navigateActionSaga(action: TNavigateToDescription) {
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
    const path =
      appMode === APP_MODE.EDIT
        ? builderURL({
            basePageId: page.basePageId,
            params,
          })
        : viewerURL({
            basePageId: page.basePageId,
            params,
          });

    if (target === NavigationTargetType.SAME_WINDOW) {
      history.push(path);

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
      text: `navigateTo('${page.pageName}') was triggered`,
      state: {
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
