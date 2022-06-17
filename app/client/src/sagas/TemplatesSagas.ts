import {
  ApplicationPayload,
  PageListPayload,
  ReduxAction,
  ReduxActionErrorTypes,
  ReduxActionTypes,
} from "@appsmith/constants/ReduxActionConstants";
import { all, put, takeEvery, call, select } from "redux-saga/effects";
import { differenceBy } from "lodash";
import TemplatesAPI, { ImportTemplateResponse } from "api/TemplatesApi";
import { PLACEHOLDER_PAGE_SLUG } from "constants/routes";
import history from "utils/history";
import { getDefaultPageId } from "./ApplicationSagas";
import {
  setTemplateNotificationSeenAction,
  showTemplatesModal,
} from "actions/templateActions";
import {
  getTemplateNotificationSeen,
  setTemplateNotificationSeen,
} from "utils/storage";
import { validateResponse } from "./ErrorSagas";
import { builderURL } from "RouteBuilder";
import { getCurrentApplicationId } from "selectors/editorSelectors";
import { getCurrentWorkspaceId } from "@appsmith/selectors/workspaceSelectors";
import { fetchApplication } from "actions/applicationActions";
import { APP_MODE } from "entities/App";
import { getPageList } from "selectors/entitiesSelector";
import {
  fetchActionsForPage,
  fetchActionsForPageError,
  fetchActionsForPageSuccess,
} from "actions/pluginActionActions";
import {
  fetchJSCollectionsForPage,
  fetchJSCollectionsForPageError,
  fetchJSCollectionsForPageSuccess,
} from "actions/jsActionActions";
import { failFastApiCalls } from "./InitSagas";
import { Toaster } from "components/ads/Toast";
import { Variant } from "components/ads/common";

function* getAllTemplatesSaga() {
  try {
    const response = yield call(TemplatesAPI.getAllTemplates);
    const isValid = yield validateResponse(response);
    if (isValid) {
      yield put({
        type: ReduxActionTypes.GET_ALL_TEMPLATES_SUCCESS,
        payload: response.data,
      });
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.GET_ALL_TEMPLATES_ERROR,
      payload: {
        error,
      },
    });
  }
}

function* importTemplateToWorkspaceSaga(
  action: ReduxAction<{ templateId: string; workspaceId: string }>,
) {
  try {
    const response: ImportTemplateResponse = yield call(
      TemplatesAPI.importTemplate,
      action.payload.templateId,
      action.payload.workspaceId,
    );
    const isValid: boolean = yield validateResponse(response);
    if (isValid) {
      const application: ApplicationPayload = {
        ...response.data,
        defaultPageId: getDefaultPageId(response.data.pages) as string,
      };
      const defaultPage = response.data.pages.find((page) => page.isDefault);
      const defaultPageSlug = defaultPage?.slug || PLACEHOLDER_PAGE_SLUG;
      const pageURL = builderURL({
        applicationId: application.id,
        applicationSlug: application.slug,
        applicationVersion: application.applicationVersion,
        pageSlug: defaultPageSlug,
        pageId: application.defaultPageId,
      });
      yield put({
        type: ReduxActionTypes.IMPORT_TEMPLATE_TO_WORKSPACE_SUCCESS,
        payload: response.data,
      });
      history.push(pageURL);
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.IMPORT_TEMPLATE_TO_WORKSPACE_ERROR,
      payload: {
        error,
      },
    });
  }
}

function* getSimilarTemplatesSaga(action: ReduxAction<string>) {
  try {
    const response = yield call(
      TemplatesAPI.getSimilarTemplates,
      action.payload,
    );
    const isValid = yield validateResponse(response);
    if (isValid) {
      yield put({
        type: ReduxActionTypes.GET_SIMILAR_TEMPLATES_SUCCESS,
        payload: response.data,
      });
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.GET_SIMILAR_TEMPLATES_ERROR,
      payload: {
        error,
      },
    });
  }
}

function* setTemplateNotificationSeenSaga(action: ReduxAction<boolean>) {
  yield setTemplateNotificationSeen(action.payload);
}

function* getTemplateNotificationSeenSaga() {
  const showTemplateNotification = yield getTemplateNotificationSeen();

  if (showTemplateNotification) {
    yield put(setTemplateNotificationSeenAction(true));
  } else {
    yield put(setTemplateNotificationSeenAction(false));
  }
}

function* getTemplateSaga(action: ReduxAction<string>) {
  try {
    const response = yield call(
      TemplatesAPI.getTemplateInformation,
      action.payload,
    );
    const isValid = yield validateResponse(response);
    if (isValid) {
      yield put({
        type: ReduxActionTypes.GET_TEMPLATE_SUCCESS,
        payload: response.data,
      });
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.GET_TEMPLATE_ERROR,
      payload: {
        error,
      },
    });
  }
}

function* postPageAdditionSaga(pageId: string) {
  const triggersAfterPageFetch = [
    fetchActionsForPage(pageId),
    fetchJSCollectionsForPage(pageId),
  ];

  const afterActionsFetch = yield failFastApiCalls(
    triggersAfterPageFetch,
    [
      fetchActionsForPageSuccess([]).type,
      fetchJSCollectionsForPageSuccess([]).type,
    ],
    [fetchActionsForPageError().type, fetchJSCollectionsForPageError().type],
  );

  if (!afterActionsFetch) {
    throw new Error("Failed importing template");
  }
}

function* forkTemplateToApplicationSaga(
  action: ReduxAction<{
    templateId: string;
    templateName: string;
    pageNames?: string[];
  }>,
) {
  try {
    const pagesToImport = action.payload.pageNames
      ? action.payload.pageNames
      : undefined;
    const applicationId: string = yield select(getCurrentApplicationId);
    const orgId: string = yield select(getCurrentWorkspaceId);
    const response: ImportTemplateResponse = yield call(
      TemplatesAPI.importTemplateToApplication,
      action.payload.templateId,
      applicationId,
      orgId,
      pagesToImport,
    );
    const currentListOfPages: PageListPayload = yield select(getPageList);
    // To fetch the new set of pages after merging the template into the existing application
    yield put(
      fetchApplication({
        mode: APP_MODE.EDIT,
        applicationId,
      }),
    );
    const isValid: boolean = yield validateResponse(response);

    if (isValid) {
      const postImportPageList = response.data.pages.map((page) => {
        return { pageId: page.id, ...page };
      });
      const newPages = differenceBy(
        postImportPageList,
        currentListOfPages,
        "pageId",
      );

      // Fetch the actions/jsobjects of the new set of pages that have been added
      for (const i in newPages) {
        if (newPages.hasOwnProperty(i)) {
          yield call(postPageAdditionSaga, newPages[i].pageId);
        }
      }

      history.push(
        builderURL({
          pageId: newPages[0].pageId,
        }),
      );
      yield put(showTemplatesModal(false));

      yield put({
        type: ReduxActionTypes.IMPORT_TEMPLATE_TO_APPLICATION_SUCCESS,
        payload: response.data,
      });

      Toaster.show({
        text: `Pages from '${action.payload.templateName}' template added successfully`,
        variant: Variant.success,
      });
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.IMPORT_TEMPLATE_TO_APPLICATION_ERROR,
      payload: {
        error,
      },
    });
  }
}

export default function* watchActionSagas() {
  yield all([
    takeEvery(ReduxActionTypes.GET_ALL_TEMPLATES_INIT, getAllTemplatesSaga),
    takeEvery(ReduxActionTypes.GET_TEMPLATE_INIT, getTemplateSaga),
    takeEvery(
      ReduxActionTypes.GET_SIMILAR_TEMPLATES_INIT,
      getSimilarTemplatesSaga,
    ),
    takeEvery(
      ReduxActionTypes.IMPORT_TEMPLATE_TO_WORKSPACE_INIT,
      importTemplateToWorkspaceSaga,
    ),
    takeEvery(
      ReduxActionTypes.GET_TEMPLATE_NOTIFICATION_SEEN,
      getTemplateNotificationSeenSaga,
    ),
    takeEvery(
      ReduxActionTypes.SET_TEMPLATE_NOTIFICATION_SEEN,
      setTemplateNotificationSeenSaga,
    ),
    takeEvery(
      ReduxActionTypes.IMPORT_TEMPLATE_TO_APPLICATION_INIT,
      forkTemplateToApplicationSaga,
    ),
  ]);
}
