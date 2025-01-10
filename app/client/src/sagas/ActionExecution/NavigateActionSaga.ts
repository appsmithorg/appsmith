import { call, put, select } from "redux-saga/effects";
import { getCurrentPageId, getPageList } from "selectors/editorSelectors";
import _ from "lodash";
import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";
import type { Page } from "entities/Page";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";
import { getAppMode, getApplicationList } from "ee/selectors/applicationSelectors";
import { APP_MODE } from "entities/App";
import { getQueryStringfromObject } from "ee/entities/URLRedirect/URLAssembly";
import history from "utils/history";
import { setDataUrl } from "ee/sagas/PageSagas";
import AppsmithConsole from "utils/AppsmithConsole";
import urlBuilder from "ce/entities/URLRedirect/URLAssembly";
import { TriggerFailureError } from "./errorUtils";
import { isValidURL, matchesURLPattern } from "utils/URLUtils";
import type { TNavigateToDescription } from "workers/Evaluation/fns/navigateTo";
import { NavigationTargetType } from "workers/Evaluation/fns/navigateTo";
import type { SourceEntity } from "entities/AppsmithConsole";
import type { ApplicationPayload } from "entities/Application";
import type { SagaIterator } from "redux-saga";

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

export default function* navigateActionSaga(
  action: TNavigateToDescription,
  source?: SourceEntity,
): SagaIterator {
  const { payload } = action;
  const pageList = (yield select(getPageList)) as Page[];
  const { pageNameOrUrl, params, target, appName } = payload;

  if (appName) {
    const applicationList = (yield select(getApplicationList)) as ApplicationPayload[];
    const app = applicationList.find((app) => app.name === appName);
    
    if (!app) {
      throw new TriggerFailureError(`No application found with name: ${appName}`);
    }

    const appMode = (yield select(getAppMode)) as APP_MODE;
    const path = urlBuilder.build(
      {
        basePageId: app.defaultPageId,
        params,
      },
      appMode,
    );

    if (target === NavigationTargetType.SAME_WINDOW) {
      window.location.assign(path);
    } else if (target === NavigationTargetType.NEW_WINDOW) {
      window.open(path, "_blank");
    }

    AppsmithConsole.info({
      source,
      text: `navigateTo('${appName}') was triggered`,
      state: {
        params,
      },
    });
    
    AnalyticsUtil.logEvent("NAVIGATE", {
      appName,
      pageParams: params,
    });
    
    return;
  }

  const page = isValidPageName(pageNameOrUrl, pageList);

  if (page) {
    const currentPageId = (yield select(getCurrentPageId)) as string;

    AnalyticsUtil.logEvent("NAVIGATE", {
      pageName: pageNameOrUrl,
      pageParams: params,
    });

    const appMode = (yield select(getAppMode)) as APP_MODE;
    const path = urlBuilder.build(
      {
        basePageId: page.basePageId,
        params,
      },
      appMode,
    );

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
