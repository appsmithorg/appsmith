import { call, select } from "redux-saga/effects";
import { getCurrentPageId, getPageList } from "selectors/editorSelectors";
import _ from "lodash";
import type { Page } from "@appsmith/constants/ReduxActionConstants";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { getAppMode } from "@appsmith/selectors/applicationSelectors";
import { APP_MODE } from "entities/App";
import { getQueryStringfromObject } from "RouteBuilder";
import history from "utils/history";
import { setDataUrl } from "sagas/PageSagas";
import AppsmithConsole from "utils/AppsmithConsole";
import { builderURL, viewerURL } from "RouteBuilder";
import { TriggerFailureError } from "./errorUtils";
import { isValidURL } from "utils/URLUtils";
import type { TNavigateToDescription } from "workers/Evaluation/fns/navigateTo";
import { NavigationTargetType } from "workers/Evaluation/fns/navigateTo";

export enum NavigationTargetType_Dep {
  SAME_WINDOW = "SAME_WINDOW",
  NEW_WINDOW = "NEW_WINDOW",
}

const isValidUrlScheme = (url: string): boolean => {
  return (
    // Standard http call
    url.startsWith("http://") ||
    // Secure http call
    url.startsWith("https://") ||
    // Mail url to directly open email app prefilled
    url.startsWith("mailto:") ||
    // Tel url to directly open phone app prefilled
    url.startsWith("tel:")
  );
};

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

  if (isValidURL(pageNameOrUrl)) {
    AnalyticsUtil.logEvent("NAVIGATE", {
      navUrl: pageNameOrUrl,
    });

    let url = pageNameOrUrl + getQueryStringfromObject(params);

    // Add a default protocol if it doesn't exist.
    if (!isValidUrlScheme(url)) {
      url = "https://" + url;
    }

    if (target === NavigationTargetType.SAME_WINDOW) {
      window.location.assign(url);
    } else if (target === NavigationTargetType.NEW_WINDOW) {
      window.open(url, "_blank");
    }
  } else if (page) {
    const currentPageId: string = yield select(getCurrentPageId);

    AnalyticsUtil.logEvent("NAVIGATE", {
      pageName: pageNameOrUrl,
      pageParams: params,
    });

    const appMode: APP_MODE = yield select(getAppMode);
    const path =
      appMode === APP_MODE.EDIT
        ? builderURL({
            pageId: page.pageId,
            params,
          })
        : viewerURL({
            pageId: page.pageId,
            params,
          });

    if (target === NavigationTargetType.SAME_WINDOW) {
      history.push(path);
      if (currentPageId === page.pageId) {
        yield call(setDataUrl);
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
    throw new TriggerFailureError("Enter a valid URL or page name");
  }
}
