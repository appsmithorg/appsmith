import CanvasWidgetsNormalizer from "normalizers/CanvasWidgetsNormalizer";
import { AppState } from "reducers";
import {
  Page,
  PageListPayload,
  ReduxAction,
  ReduxActionErrorTypes,
  ReduxActionTypes,
  UpdateCanvasPayload,
} from "constants/ReduxActionConstants";
import {
  clonePageSuccess,
  deletePageSuccess,
  FetchPageListPayload,
  fetchPageSuccess,
  fetchPublishedPageSuccess,
  savePageSuccess,
  setUrlData,
  initCanvasLayout,
  updateCurrentPage,
  updateWidgetNameSuccess,
  updateAndSaveLayout,
  saveLayout,
  setLastUpdatedTime,
  ClonePageActionPayload,
  CreatePageActionPayload,
} from "actions/pageActions";
import PageApi, {
  ClonePageRequest,
  CreatePageRequest,
  DeletePageRequest,
  FetchPageListResponse,
  FetchPageRequest,
  FetchPageResponse,
  FetchPublishedPageRequest,
  FetchPublishedPageResponse,
  PageLayout,
  SavePageResponse,
  SetPageOrderRequest,
  UpdatePageRequest,
  UpdateWidgetNameRequest,
  UpdateWidgetNameResponse,
} from "api/PageApi";
import { FlattenedWidgetProps } from "reducers/entityReducers/canvasWidgetsReducer";
import {
  all,
  call,
  debounce,
  put,
  select,
  takeLatest,
  takeLeading,
} from "redux-saga/effects";
import history from "utils/history";
import { BUILDER_PAGE_URL } from "constants/routes";
import { captureInvalidDynamicBindingPath, isNameValid } from "utils/helpers";
import { extractCurrentDSL } from "utils/WidgetPropsUtils";
import { checkIfMigrationIsNeeded } from "utils/DSLMigrations";
import {
  getAllPageIds,
  getEditorConfigs,
  getExistingPageNames,
  getWidgets,
} from "./selectors";
import { getDataTree } from "selectors/dataTreeSelectors";
import { IncorrectBindingError, validateResponse } from "./ErrorSagas";
import { ApiResponse, GenericApiResponse } from "api/ApiResponses";
import {
  getCurrentApplicationId,
  getCurrentLayoutId,
  getCurrentPageId,
  getCurrentPageName,
} from "selectors/editorSelectors";
import {
  executePageLoadActions,
  fetchActionsForPage,
  setActionsToExecuteOnPageLoad,
} from "actions/pluginActionActions";
import { UrlDataState } from "reducers/entityReducers/appReducer";
import { APP_MODE } from "entities/App";
import { clearEvalCache } from "./EvaluationsSaga";
import { getQueryParams } from "utils/AppsmithUtils";
import PerformanceTracker, {
  PerformanceTransactionName,
} from "utils/PerformanceTracker";
import log from "loglevel";
import { Toaster } from "components/ads/Toast";
import { Variant } from "components/ads/common";
import { migrateIncorrectDynamicBindingPathLists } from "utils/migrations/IncorrectDynamicBindingPathLists";
import * as Sentry from "@sentry/react";
import { ERROR_CODES } from "@appsmith/constants/ApiConstants";
import AnalyticsUtil from "utils/AnalyticsUtil";
import DEFAULT_TEMPLATE from "templates/default";
import { GenerateTemplatePageRequest } from "../api/PageApi";
import { getGenerateTemplateURL } from "../constants/routes";
import {
  generateTemplateError,
  generateTemplateSuccess,
} from "../actions/pageActions";
import { getAppMode } from "selectors/applicationSelectors";
import { setCrudInfoModalData } from "actions/crudInfoModalActions";
import { selectMultipleWidgetsAction } from "actions/widgetSelectionActions";
import {
  getIsFirstTimeUserOnboardingEnabled,
  getFirstTimeUserOnboardingApplicationId,
  inGuidedTour,
} from "selectors/onboardingSelectors";
import { fetchJSCollectionsForPage } from "actions/jsActionActions";

import WidgetFactory from "utils/WidgetFactory";
import { toggleShowDeviationDialog } from "actions/onboardingActions";

const WidgetTypes = WidgetFactory.widgetTypes;

const getWidgetName = (state: AppState, widgetId: string) =>
  state.entities.canvasWidgets[widgetId];

export function* fetchPageListSaga(
  fetchPageListAction: ReduxAction<FetchPageListPayload>,
) {
  PerformanceTracker.startAsyncTracking(
    PerformanceTransactionName.FETCH_PAGE_LIST_API,
  );
  try {
    const { applicationId, mode } = fetchPageListAction.payload;
    const apiCall =
      mode === APP_MODE.EDIT
        ? PageApi.fetchPageList
        : PageApi.fetchPageListViewMode;
    const response: FetchPageListResponse = yield call(apiCall, applicationId);
    const isValidResponse: boolean = yield validateResponse(response);
    if (isValidResponse) {
      const orgId = response.data.organizationId;
      const pages: PageListPayload = response.data.pages.map((page) => ({
        pageName: page.name,
        pageId: page.id,
        isDefault: page.isDefault,
        isHidden: !!page.isHidden,
      }));
      yield put({
        type: ReduxActionTypes.SET_CURRENT_ORG_ID,
        payload: {
          orgId,
        },
      });
      yield put({
        type: ReduxActionTypes.FETCH_PAGE_LIST_SUCCESS,
        payload: {
          pages,
          applicationId: applicationId,
        },
      });
      PerformanceTracker.stopAsyncTracking(
        PerformanceTransactionName.FETCH_PAGE_LIST_API,
      );
    } else {
      PerformanceTracker.stopAsyncTracking(
        PerformanceTransactionName.FETCH_PAGE_LIST_API,
      );
      yield put({
        type: ReduxActionErrorTypes.FETCH_PAGE_LIST_ERROR,
        payload: {
          error: response.responseMeta.error,
        },
      });
    }
  } catch (error) {
    PerformanceTracker.stopAsyncTracking(
      PerformanceTransactionName.FETCH_PAGE_LIST_API,
      { failed: true },
    );
    yield put({
      type: ReduxActionErrorTypes.FETCH_PAGE_LIST_ERROR,
      payload: {
        error,
      },
    });
  }
}

export const getCanvasWidgetsPayload = (
  pageResponse: FetchPageResponse,
): UpdateCanvasPayload => {
  const normalizedResponse = CanvasWidgetsNormalizer.normalize(
    extractCurrentDSL(pageResponse),
  );
  return {
    pageWidgetId: normalizedResponse.result,
    currentPageName: pageResponse.data.name,
    currentPageId: pageResponse.data.id,
    widgets: normalizedResponse.entities.canvasWidgets,
    currentLayoutId: pageResponse.data.layouts[0].id, // TODO(abhinav): Handle for multiple layouts
    currentApplicationId: pageResponse.data.applicationId,
    pageActions: pageResponse.data.layouts[0].layoutOnLoadActions || [],
  };
};

function* handleFetchedPage({
  fetchPageResponse,
  isFirstLoad = false,
  pageId,
}: {
  fetchPageResponse: FetchPageResponse;
  pageId: string;
  isFirstLoad?: boolean;
}) {
  const isValidResponse = yield validateResponse(fetchPageResponse);
  const willPageBeMigrated = checkIfMigrationIsNeeded(fetchPageResponse);
  const lastUpdatedTime = getLastUpdateTime(fetchPageResponse);

  if (isValidResponse) {
    // Clear any existing caches
    yield call(clearEvalCache);
    // Set url params
    yield call(setDataUrl);
    // Get Canvas payload
    const canvasWidgetsPayload = getCanvasWidgetsPayload(fetchPageResponse);
    // Update the canvas
    yield put(initCanvasLayout(canvasWidgetsPayload));
    // set current page
    yield put(updateCurrentPage(pageId));
    // dispatch fetch page success
    yield put(
      fetchPageSuccess(
        // Execute page load actions post page load
        isFirstLoad ? [] : [executePageLoadActions()],
      ),
    );
    // Sets last updated time
    yield put(setLastUpdatedTime(lastUpdatedTime));
    const extractedDSL = extractCurrentDSL(fetchPageResponse);
    yield put({
      type: ReduxActionTypes.UPDATE_CANVAS_STRUCTURE,
      payload: extractedDSL,
    });

    if (willPageBeMigrated) {
      yield put(saveLayout());
    }
  }
}
const getLastUpdateTime = (pageResponse: FetchPageResponse): number =>
  pageResponse.data.lastUpdatedTime;

export function* fetchPageSaga(
  pageRequestAction: ReduxAction<FetchPageRequest>,
) {
  try {
    const { id, isFirstLoad } = pageRequestAction.payload;
    PerformanceTracker.startAsyncTracking(
      PerformanceTransactionName.FETCH_PAGE_API,
      { pageId: id },
    );
    const fetchPageResponse: FetchPageResponse = yield call(PageApi.fetchPage, {
      id,
    });
    yield handleFetchedPage({
      fetchPageResponse,
      pageId: id,
      isFirstLoad,
    });

    PerformanceTracker.stopAsyncTracking(
      PerformanceTransactionName.FETCH_PAGE_API,
    );
  } catch (error) {
    log.error(error);
    PerformanceTracker.stopAsyncTracking(
      PerformanceTransactionName.FETCH_PAGE_API,
      {
        failed: true,
      },
    );
    yield put({
      type: ReduxActionErrorTypes.FETCH_PAGE_ERROR,
      payload: {
        error,
      },
    });
  }
}

export function* fetchPublishedPageSaga(
  pageRequestAction: ReduxAction<{ pageId: string; bustCache: boolean }>,
) {
  try {
    const { bustCache, pageId } = pageRequestAction.payload;
    PerformanceTracker.startAsyncTracking(
      PerformanceTransactionName.FETCH_PAGE_API,
      {
        pageId: pageId,
        published: true,
      },
    );
    const request: FetchPublishedPageRequest = {
      pageId,
      bustCache,
    };
    const response: FetchPublishedPageResponse = yield call(
      PageApi.fetchPublishedPage,
      request,
    );
    const isValidResponse: boolean = yield validateResponse(response);
    if (isValidResponse) {
      // Clear any existing caches
      yield call(clearEvalCache);
      // Set url params
      yield call(setDataUrl);
      // Get Canvas payload
      const canvasWidgetsPayload = getCanvasWidgetsPayload(response);
      // Update the canvas
      yield put(initCanvasLayout(canvasWidgetsPayload));
      // set current page
      yield put(updateCurrentPage(pageId));
      // dispatch fetch page success
      yield put(
        fetchPublishedPageSuccess(
          // Execute page load actions post published page eval
          [executePageLoadActions()],
        ),
      );
      PerformanceTracker.stopAsyncTracking(
        PerformanceTransactionName.FETCH_PAGE_API,
      );
    }
  } catch (error) {
    PerformanceTracker.stopAsyncTracking(
      PerformanceTransactionName.FETCH_PAGE_API,
      {
        failed: true,
      },
    );
    yield put({
      type: ReduxActionErrorTypes.FETCH_PUBLISHED_PAGE_ERROR,
      payload: {
        error,
      },
    });
  }
}

export function* fetchAllPublishedPagesSaga() {
  try {
    const pageIds = yield select(getAllPageIds);
    yield all(
      pageIds.map((pageId: string) => {
        return call(PageApi.fetchPublishedPage, { pageId });
      }),
    );
  } catch (error) {
    log.error({ error });
  }
}

function* savePageSaga(action: ReduxAction<{ isRetry?: boolean }>) {
  const widgets = yield select(getWidgets);
  const editorConfigs = yield select(getEditorConfigs) as any;
  const guidedTourEnabled = yield select(inGuidedTour);
  const savePageRequest = getLayoutSavePayload(widgets, editorConfigs);
  PerformanceTracker.startAsyncTracking(
    PerformanceTransactionName.SAVE_PAGE_API,
    {
      pageId: savePageRequest.pageId,
    },
  );
  try {
    // Store the updated DSL in the pageDSLs reducer
    yield put({
      type: ReduxActionTypes.FETCH_PAGE_DSL_SUCCESS,
      payload: {
        pageId: savePageRequest.pageId,
        dsl: savePageRequest.dsl,
      },
    });

    yield put({
      type: ReduxActionTypes.UPDATE_CANVAS_STRUCTURE,
      payload: savePageRequest.dsl,
    });

    captureInvalidDynamicBindingPath(
      CanvasWidgetsNormalizer.denormalize("0", {
        canvasWidgets: widgets,
      }),
    );

    const savePageResponse: SavePageResponse = yield call(
      PageApi.savePage,
      savePageRequest,
    );
    const isValidResponse: boolean = yield validateResponse(savePageResponse);
    if (isValidResponse) {
      const { actionUpdates, messages } = savePageResponse.data;
      // We do not want to show these toasts in guided tour
      // Show toast messages from the server
      if (messages && messages.length && !guidedTourEnabled) {
        savePageResponse.data.messages.forEach((message) => {
          Toaster.show({
            text: message,
            type: Variant.info,
          });
        });
      }
      // Update actions
      if (actionUpdates && actionUpdates.length > 0) {
        yield put(setActionsToExecuteOnPageLoad(actionUpdates));
      }
      yield put(setLastUpdatedTime(Date.now() / 1000));
      yield put(savePageSuccess(savePageResponse));
      PerformanceTracker.stopAsyncTracking(
        PerformanceTransactionName.SAVE_PAGE_API,
      );
    }
  } catch (error) {
    PerformanceTracker.stopAsyncTracking(
      PerformanceTransactionName.SAVE_PAGE_API,
      {
        failed: true,
      },
    );

    yield put({
      type: ReduxActionErrorTypes.SAVE_PAGE_ERROR,
      payload: {
        error,
        show: false,
      },
    });

    if (error instanceof IncorrectBindingError) {
      const { isRetry } = action?.payload;
      const incorrectBindingError = JSON.parse(error.message);
      const { message } = incorrectBindingError;
      if (isRetry) {
        Sentry.captureException(new Error("Failed to correct binding paths"));
        yield put({
          type: ReduxActionErrorTypes.FAILED_CORRECTING_BINDING_PATHS,
          payload: {
            error: {
              message,
              code: ERROR_CODES.FAILED_TO_CORRECT_BINDING,
              crash: true,
            },
          },
        });
      } else {
        // Create a denormalized structure because the migration needs the children in the dsl form
        const denormalizedWidgets = CanvasWidgetsNormalizer.denormalize("0", {
          canvasWidgets: widgets,
        });
        const correctedWidgets = migrateIncorrectDynamicBindingPathLists(
          denormalizedWidgets,
        );
        // Normalize the widgets because the save page needs it in the flat structure
        const normalizedWidgets = CanvasWidgetsNormalizer.normalize(
          correctedWidgets,
        );
        AnalyticsUtil.logEvent("CORRECT_BAD_BINDING", {
          error: error.message,
          correctWidget: JSON.stringify(normalizedWidgets),
        });
        yield put(
          updateAndSaveLayout(normalizedWidgets.entities.canvasWidgets, true),
        );
      }
    }
  }
}

function getLayoutSavePayload(
  widgets: {
    [widgetId: string]: FlattenedWidgetProps;
  },
  editorConfigs: any,
) {
  const denormalizedDSL = CanvasWidgetsNormalizer.denormalize(
    Object.keys(widgets)[0],
    { canvasWidgets: widgets },
  );
  return {
    ...editorConfigs,
    dsl: denormalizedDSL,
  };
}

export function* saveLayoutSaga(action: ReduxAction<{ isRetry?: boolean }>) {
  try {
    const appMode: APP_MODE | undefined = yield select(getAppMode);
    if (appMode === APP_MODE.EDIT) {
      yield put(saveLayout(action.payload.isRetry));
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.SAVE_PAGE_ERROR,
      payload: {
        error,
      },
    });
  }
}

export function* createPageSaga(
  createPageAction: ReduxAction<CreatePageActionPayload>,
) {
  try {
    const guidedTourEnabled = yield select(inGuidedTour);
    // Prevent user from creating a new page during the guided tour
    if (guidedTourEnabled) {
      yield put(toggleShowDeviationDialog(true));
      return;
    }
    const request: CreatePageRequest = createPageAction.payload;
    const response: FetchPageResponse = yield call(PageApi.createPage, request);
    const isValidResponse: boolean = yield validateResponse(response);
    if (isValidResponse) {
      yield put({
        type: ReduxActionTypes.CREATE_PAGE_SUCCESS,
        payload: {
          pageId: response.data.id,
          pageName: response.data.name,
          layoutId: response.data.layouts[0].id,
        },
      });
      // Add this to the page DSLs for entity explorer
      yield put({
        type: ReduxActionTypes.FETCH_PAGE_DSL_SUCCESS,
        payload: {
          pageId: response.data.id,
          dsl: extractCurrentDSL(response),
        },
      });
      // route to generate template for new page created
      if (!createPageAction.payload.blockNavigation) {
        const firstTimeUserOnboardingApplicationId = yield select(
          getFirstTimeUserOnboardingApplicationId,
        );
        const isFirstTimeUserOnboardingEnabled = yield select(
          getIsFirstTimeUserOnboardingEnabled,
        );
        if (
          firstTimeUserOnboardingApplicationId ==
            createPageAction.payload.applicationId &&
          isFirstTimeUserOnboardingEnabled
        ) {
          history.push(
            BUILDER_PAGE_URL({
              applicationId: createPageAction.payload.applicationId,
              pageId: response.data.id,
            }),
          );
        } else {
          history.push(
            getGenerateTemplateURL(
              createPageAction.payload.applicationId,
              response.data.id,
            ),
          );
        }
      }
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.CREATE_PAGE_ERROR,
      payload: {
        error,
      },
    });
  }
}

export function* updatePageSaga(action: ReduxAction<UpdatePageRequest>) {
  try {
    const request: UpdatePageRequest = action.payload;
    const response: ApiResponse = yield call(PageApi.updatePage, request);
    const isValidResponse: boolean = yield validateResponse(response);
    if (isValidResponse) {
      yield put({
        type: ReduxActionTypes.UPDATE_PAGE_SUCCESS,
        payload: action.payload,
      });
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.UPDATE_PAGE_ERROR,
      payload: {
        error,
      },
    });
  }
}

export function* deletePageSaga(action: ReduxAction<DeletePageRequest>) {
  try {
    const request: DeletePageRequest = action.payload;
    const defaultPageId = yield select(
      (state: AppState) => state.entities.pageList.defaultPageId,
    );
    const applicationId = yield select(
      (state: AppState) => state.entities.pageList.applicationId,
    );
    if (defaultPageId === request.id) {
      throw Error("Cannot delete the home page.");
    } else {
      const response: ApiResponse = yield call(PageApi.deletePage, request);
      const isValidResponse: boolean = yield validateResponse(response);
      if (isValidResponse) {
        yield put(deletePageSuccess());
      }
      // Remove this page from page DSLs
      yield put({
        type: ReduxActionTypes.FETCH_PAGE_DSL_SUCCESS,
        payload: {
          pageId: request.id,
          dsl: undefined,
        },
      });
      const currentPageId = yield select(
        (state: AppState) => state.entities.pageList.currentPageId,
      );
      if (currentPageId === action.payload.id)
        history.push(
          BUILDER_PAGE_URL({
            applicationId: applicationId,
            pageId: defaultPageId,
          }),
        );
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.DELETE_PAGE_ERROR,
      payload: {
        error: { message: error.message, show: true },
        show: true,
      },
    });
  }
}

export function* clonePageSaga(
  clonePageAction: ReduxAction<ClonePageActionPayload>,
) {
  try {
    const request: ClonePageRequest = clonePageAction.payload;
    const response: FetchPageResponse = yield call(PageApi.clonePage, request);
    const isValidResponse: boolean = yield validateResponse(response);
    if (isValidResponse) {
      yield put(
        clonePageSuccess(
          response.data.id,
          response.data.name,
          response.data.layouts[0].id,
        ),
      );
      // Add this to the page DSLs for entity explorer
      yield put({
        type: ReduxActionTypes.FETCH_PAGE_DSL_SUCCESS,
        payload: {
          pageId: response.data.id,
          dsl: extractCurrentDSL(response),
        },
      });

      yield put(fetchActionsForPage(response.data.id));
      yield put(fetchJSCollectionsForPage(response.data.id));
      yield put(selectMultipleWidgetsAction([]));

      if (!clonePageAction.payload.blockNavigation) {
        const applicationId = yield select(getCurrentApplicationId);
        history.push(
          BUILDER_PAGE_URL({
            applicationId,
            pageId: response.data.id,
          }),
        );
      }
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.CLONE_PAGE_ERROR,
      payload: {
        error,
      },
    });
  }
}

/**
 * this saga do two things
 *
 * 1. Checks if the name of page is conflicting with any used name
 * 2. dispatches a action which triggers a request to update the name
 *
 * @param action
 */
export function* updateWidgetNameSaga(
  action: ReduxAction<{ id: string; newName: string }>,
) {
  try {
    const { widgetName } = yield select(getWidgetName, action.payload.id);
    const layoutId = yield select(getCurrentLayoutId);
    const evalTree = yield select(getDataTree);
    const pageId = yield select(getCurrentPageId);
    const existingPageNames = yield select(getExistingPageNames);

    // TODO(abhinav): Why do we need to jump through these hoops just to
    // change the tab name? Figure out a better design to make this moot.
    const tabsObj: Record<
      string,
      {
        id: string;
        widgetId: string;
        label: string;
      }
    > = yield select((state: AppState) => {
      // Check if this widget exists in the canvas widgets
      if (state.entities.canvasWidgets.hasOwnProperty(action.payload.id)) {
        // If it does assign it to a variable
        const widget = state.entities.canvasWidgets[action.payload.id];
        // Check if this widget has a parent in the canvas widgets
        if (
          widget.parentId &&
          state.entities.canvasWidgets.hasOwnProperty(widget.parentId)
        ) {
          // If the parent exists assign it to a variable
          const parent = state.entities.canvasWidgets[widget.parentId];
          // Check if this parent is a TABS_WIDGET
          if (parent.type === WidgetTypes.TABS_WIDGET) {
            // If it is return the tabs property
            return parent.tabsObj;
          }
        }
      }
      // This isn't a tab in a tabs widget so return undefined
      return;
    });

    // If we're trying to update the name of a tab in the TABS_WIDGET
    if (tabsObj !== undefined) {
      const tabs: any = Object.values(tabsObj);
      // Get all canvas widgets
      const stateWidgets = yield select(getWidgets);
      // Shallow copy canvas widgets as they're immutable
      const widgets = { ...stateWidgets };
      // Get the parent Id of the tab (canvas widget) whose name we're updating
      const parentId = widgets[action.payload.id].parentId;
      // Update the tabName property of the tab (canvas widget)
      widgets[action.payload.id] = {
        ...widgets[action.payload.id],
        tabName: action.payload.newName,
      };
      // Shallow copy the parent widget so that we can update the properties
      const parent = { ...widgets[parentId] };
      // Update the tabs property of the parent tabs widget
      const tabToChange = tabs.find(
        (each: any) => each.widgetId === action.payload.id,
      );
      const updatedTab = {
        ...tabToChange,
        label: action.payload.newName,
      };
      parent.tabsObj = {
        ...parent.tabsObj,
        [updatedTab.id]: {
          ...updatedTab,
        },
      };
      // replace the parent widget in the canvas widgets
      widgets[parentId] = parent;
      // Update and save the new widgets
      yield put(updateAndSaveLayout(widgets));
      // Send a update saying that we've successfully updated the name
      yield put(updateWidgetNameSuccess());
    } else {
      // check if name is not conflicting with any
      // existing entity/api/queries/reserved words
      if (
        isNameValid(action.payload.newName, {
          ...evalTree,
          ...existingPageNames,
        })
      ) {
        const request: UpdateWidgetNameRequest = {
          newName: action.payload.newName,
          oldName: widgetName,
          pageId,
          layoutId,
        };
        const response: UpdateWidgetNameResponse = yield call(
          PageApi.updateWidgetName,
          request,
        );
        const isValidResponse: boolean = yield validateResponse(response);
        if (isValidResponse) {
          yield updateCanvasWithDSL(response.data, pageId, layoutId);
          yield put(updateWidgetNameSuccess());
          // Add this to the page DSLs for entity explorer
          yield put({
            type: ReduxActionTypes.FETCH_PAGE_DSL_SUCCESS,
            payload: {
              pageId: pageId,
              dsl: response.data.dsl,
            },
          });
        }
      } else {
        yield put({
          type: ReduxActionErrorTypes.UPDATE_WIDGET_NAME_ERROR,
          payload: {
            error: {
              message: `Entity name: ${action.payload.newName} is already being used or is a restricted keyword.`,
            },
          },
        });
      }
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.UPDATE_WIDGET_NAME_ERROR,
      payload: {
        error,
      },
    });
  }
}

export function* updateCanvasWithDSL(
  data: PageLayout,
  pageId: string,
  layoutId: string,
) {
  const normalizedWidgets = CanvasWidgetsNormalizer.normalize(data.dsl);
  const currentPageName = yield select(getCurrentPageName);
  const applicationId = yield select(getCurrentApplicationId);
  const canvasWidgetsPayload: UpdateCanvasPayload = {
    pageWidgetId: normalizedWidgets.result,
    currentPageName,
    currentPageId: pageId,
    currentLayoutId: layoutId,
    currentApplicationId: applicationId,
    pageActions: data.layoutOnLoadActions,
    widgets: normalizedWidgets.entities.canvasWidgets,
  };
  yield put(initCanvasLayout(canvasWidgetsPayload));
  yield put(fetchActionsForPage(pageId));
  yield put(fetchJSCollectionsForPage(pageId));
}

export function* setDataUrl() {
  const urlData: UrlDataState = {
    fullPath: window.location.href,
    host: window.location.host,
    hostname: window.location.hostname,
    queryParams: getQueryParams(),
    protocol: window.location.protocol,
    pathname: window.location.pathname,
    port: window.location.port,
    hash: window.location.hash,
  };
  yield put(setUrlData(urlData));
}

function* fetchPageDSLSaga(pageId: string) {
  try {
    const fetchPageResponse: FetchPageResponse = yield call(PageApi.fetchPage, {
      id: pageId,
    });
    const isValidResponse: boolean = yield validateResponse(fetchPageResponse);
    if (isValidResponse) {
      return {
        pageId: pageId,
        dsl: extractCurrentDSL(fetchPageResponse),
      };
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.FETCH_PAGE_DSL_ERROR,
      payload: {
        pageId: pageId,
        error,
        show: true,
      },
    });
    return {
      pageId: pageId,
      dsl: DEFAULT_TEMPLATE,
    };
  }
}

export function* populatePageDSLsSaga() {
  try {
    yield put({
      type: ReduxActionTypes.POPULATE_PAGEDSLS_INIT,
    });
    const pageIds: string[] = yield select((state: AppState) =>
      state.entities.pageList.pages.map((page: Page) => page.pageId),
    );
    const pageDSLs = yield all(
      pageIds.map((pageId: string) => {
        return call(fetchPageDSLSaga, pageId);
      }),
    );
    yield put({
      type: ReduxActionTypes.FETCH_PAGE_DSLS_SUCCESS,
      payload: pageDSLs,
    });
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.POPULATE_PAGEDSLS_ERROR,
      payload: {
        error,
      },
    });
  }
}

/**
 * saga to update the page order
 *
 * @param action
 */
export function* setPageOrderSaga(action: ReduxAction<SetPageOrderRequest>) {
  try {
    const request: SetPageOrderRequest = action.payload;
    const response: ApiResponse = yield call(PageApi.setPageOrder, request);
    const isValidResponse = yield validateResponse(response);
    if (isValidResponse) {
      yield put({
        type: ReduxActionTypes.SET_PAGE_ORDER_SUCCESS,
        payload: {
          pages: response.data.pages,
        },
      });
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.SET_PAGE_ORDER_ERROR,
      payload: {
        error,
      },
    });
  }
}

export function* generateTemplatePageSaga(
  action: ReduxAction<GenerateTemplatePageRequest>,
) {
  try {
    const request: GenerateTemplatePageRequest = action.payload;
    // if pageId is available in request, it will just update that page else it will generate new page.
    const response: GenericApiResponse<{
      page: any;
      successImageUrl: string;
      successMessage: string;
    }> = yield call(PageApi.generateTemplatePage, request);

    const isValidResponse: boolean = yield validateResponse(response);
    if (isValidResponse) {
      const pageId = response.data.page.id;
      yield handleFetchedPage({
        fetchPageResponse: {
          data: response.data.page,
          responseMeta: response.responseMeta,
        },
        pageId,
      });

      // TODO : Add this to onSuccess (Redux Action)
      yield put(
        generateTemplateSuccess({
          page: response.data.page,
          isNewPage: !request.pageId, // if pageId if not defined, that means a new page is generated.
        }),
      );
      // TODO : Add this to onSuccess (Redux Action)
      yield put(fetchActionsForPage(pageId, [executePageLoadActions()]));
      // TODO : Add it to onSuccessCallback
      const applicationId = yield select(getCurrentApplicationId);
      history.replace(
        BUILDER_PAGE_URL({
          applicationId,
          pageId,
        }),
      );
      // TODO : Add it to onSuccessCallback
      Toaster.show({
        text: "Successfully generated a page",
        variant: Variant.success,
      });

      yield put(
        setCrudInfoModalData({
          open: true,
          generateCRUDSuccessInfo: {
            successImageUrl: response.data.successImageUrl,
            successMessage: response.data.successMessage,
          },
        }),
      );
    }
  } catch (error) {
    yield put(generateTemplateError());
  }
}

export default function* pageSagas() {
  yield all([
    takeLatest(ReduxActionTypes.FETCH_PAGE_INIT, fetchPageSaga),
    takeLatest(
      ReduxActionTypes.FETCH_PUBLISHED_PAGE_INIT,
      fetchPublishedPageSaga,
    ),
    takeLatest(ReduxActionTypes.UPDATE_LAYOUT, saveLayoutSaga),
    takeLeading(ReduxActionTypes.CREATE_PAGE_INIT, createPageSaga),
    takeLeading(ReduxActionTypes.CLONE_PAGE_INIT, clonePageSaga),
    takeLatest(ReduxActionTypes.FETCH_PAGE_LIST_INIT, fetchPageListSaga),
    takeLatest(ReduxActionTypes.UPDATE_PAGE_INIT, updatePageSaga),
    takeLatest(ReduxActionTypes.DELETE_PAGE_INIT, deletePageSaga),
    debounce(500, ReduxActionTypes.SAVE_PAGE_INIT, savePageSaga),
    takeLatest(ReduxActionTypes.UPDATE_WIDGET_NAME_INIT, updateWidgetNameSaga),
    takeLatest(
      ReduxActionTypes.FETCH_ALL_PUBLISHED_PAGES,
      fetchAllPublishedPagesSaga,
    ),
    takeLatest(
      ReduxActionTypes.GENERATE_TEMPLATE_PAGE_INIT,
      generateTemplatePageSaga,
    ),
    takeLatest(ReduxActionTypes.SET_PAGE_ORDER_INIT, setPageOrderSaga),
  ]);
}
