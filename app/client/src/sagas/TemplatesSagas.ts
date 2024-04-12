import { builderURL } from "@appsmith/RouteBuilder";
import {
  fetchApplication,
  showReconnectDatasourceModal,
} from "@appsmith/actions/applicationActions";
import ApplicationApi from "@appsmith/api/ApplicationApi";
import type {
  ApplicationPayload,
  ReduxAction,
} from "@appsmith/constants/ReduxActionConstants";
import {
  ReduxActionErrorTypes,
  ReduxActionTypes,
} from "@appsmith/constants/ReduxActionConstants";
import urlBuilder from "@appsmith/entities/URLRedirect/URLAssembly";
import { getDefaultPageId } from "@appsmith/sagas/ApplicationSagas";
import { fetchPageDSLSaga } from "@appsmith/sagas/PageSagas";
import { getCanvasWidgets } from "@appsmith/selectors/entitiesSelector";
import { getCurrentWorkspaceId } from "@appsmith/selectors/selectedWorkspaceSelectors";
import { isAirgapped } from "@appsmith/utils/airgapHelpers";
import { flattenDSL } from "@shared/dsl";
import type { WidgetProps } from "@shared/dsl/src/migrate/types";
import type { FlattenedWidgetProps } from "WidgetProvider/constants";
import { fetchJSLibraries } from "actions/JSLibraryActions";
import { fetchDatasources } from "actions/datasourceActions";
import { fetchJSCollections } from "actions/jsActionActions";
import { fetchAllPageEntityCompletion, saveLayout } from "actions/pageActions";
import {
  executePageLoadActions,
  fetchActions,
  runAction,
} from "actions/pluginActionActions";
import { fetchPluginFormConfigs } from "actions/pluginActions";
import {
  getAllTemplates,
  hideTemplatesModal,
  setTemplateNotificationSeenAction,
  showStarterBuildingBlockDatasourcePrompt,
} from "actions/templateActions";
import { pasteWidget } from "actions/widgetActions";
import { selectWidgetInitAction } from "actions/widgetSelectionActions";
import type { ApiResponse } from "api/ApiResponses";
import type {
  FetchTemplateResponse,
  ImportTemplateResponse,
  TemplateFiltersResponse,
} from "api/TemplatesApi";
import TemplatesAPI from "api/TemplatesApi";
import { STARTER_BUILDING_BLOCKS } from "constants/TemplatesConstants";
import { MAIN_CONTAINER_WIDGET_ID } from "constants/WidgetConstants";
import { toast } from "design-system";
import type { PluginType } from "entities/Action";
import { APP_MODE } from "entities/App";
import {
  getWidgetLayoutMetaInfo,
  type WidgetLayoutPositionInfo,
} from "layoutSystems/anvil/utils/layouts/widgetPositionUtils";
import type { CopiedWidgetData } from "layoutSystems/anvil/utils/paste/types";
import { getWidgetHierarchy } from "layoutSystems/anvil/utils/paste/utils";
import { LayoutSystemTypes } from "layoutSystems/types";
import type { CanvasWidgetsReduxState } from "reducers/entityReducers/canvasWidgetsReducer";
import {
  all,
  call,
  delay,
  put,
  select,
  take,
  takeEvery,
} from "redux-saga/effects";
import { getWidgets } from "sagas/selectors";
import {
  getCurrentApplicationId,
  getCurrentPageId,
} from "selectors/editorSelectors";
import { getLayoutSystemType } from "selectors/layoutSystemSelectors";
import history from "utils/history";
import {
  getTemplateNotificationSeen,
  saveCopiedWidgets,
  setTemplateNotificationSeen,
} from "utils/storage";
import { validateResponse } from "./ErrorSagas";
import { failFastApiCalls } from "./InitSagas";
import { SelectionRequestType } from "./WidgetSelectUtils";
import { getAllPageIds } from "./selectors";

const isAirgappedInstance = isAirgapped();

function* getAllTemplatesSaga() {
  try {
    const response: FetchTemplateResponse = yield call(
      TemplatesAPI.getAllTemplates,
    );
    const isValid: boolean = yield validateResponse(response);
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
        ...response.data.application,
        defaultPageId: getDefaultPageId(
          response.data.application.pages,
        ) as string,
      };
      yield put({
        type: ReduxActionTypes.IMPORT_TEMPLATE_TO_WORKSPACE_SUCCESS,
        payload: response.data.application,
      });

      if (response.data.isPartialImport) {
        yield put(
          showReconnectDatasourceModal({
            application: response.data.application,
            unConfiguredDatasourceList:
              response.data.unConfiguredDatasourceList,
            workspaceId: action.payload.workspaceId,
          }),
        );
      } else {
        const pageURL = builderURL({
          pageId: application.defaultPageId,
        });
        history.push(pageURL);
      }
      yield put(getAllTemplates());
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
    const response: FetchTemplateResponse = yield call(
      TemplatesAPI.getSimilarTemplates,
      action.payload,
    );
    const isValid: boolean = yield validateResponse(response);
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
  const showTemplateNotification: unknown = yield getTemplateNotificationSeen();

  if (showTemplateNotification) {
    yield put(setTemplateNotificationSeenAction(true));
  } else {
    yield put(setTemplateNotificationSeenAction(false));
  }
}

function* getTemplateSaga(action: ReduxAction<string>) {
  try {
    const response: FetchTemplateResponse = yield call(
      TemplatesAPI.getTemplateInformation,
      action.payload,
    );
    const isValid: boolean = yield validateResponse(response);
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

export function* postPageAdditionSaga(applicationId: string) {
  const afterActionsFetch: boolean = yield failFastApiCalls(
    [
      fetchActions({ applicationId }, []),
      fetchJSCollections({ applicationId }),
      fetchDatasources(),
      fetchJSLibraries(applicationId),
    ],
    [
      ReduxActionTypes.FETCH_ACTIONS_SUCCESS,
      ReduxActionTypes.FETCH_JS_ACTIONS_SUCCESS,
      ReduxActionTypes.FETCH_DATASOURCES_SUCCESS,
      ReduxActionTypes.FETCH_JS_LIBRARIES_SUCCESS,
    ],
    [
      ReduxActionErrorTypes.FETCH_ACTIONS_ERROR,
      ReduxActionErrorTypes.FETCH_JS_ACTIONS_ERROR,
      ReduxActionErrorTypes.FETCH_DATASOURCES_ERROR,
      ReduxActionErrorTypes.FETCH_JS_LIBRARIES_FAILED,
    ],
  );

  if (!afterActionsFetch) {
    throw new Error("Failed importing template");
  }

  const afterPluginFormsFetch: boolean = yield failFastApiCalls(
    [fetchPluginFormConfigs()],
    [ReduxActionTypes.FETCH_PLUGIN_FORM_CONFIGS_SUCCESS],
    [ReduxActionErrorTypes.FETCH_PLUGIN_FORM_CONFIGS_ERROR],
  );

  if (!afterPluginFormsFetch) {
    throw new Error("Failed importing template");
  }

  yield put(fetchAllPageEntityCompletion([executePageLoadActions()]));
}

interface ImportBuildingBlockToApplicationResponse {
  widgetDsl: string;
  onPageLoadActions: {
    confirmBeforeExecute: boolean;
    id: string;
    jsonPathKeys: string[];
    name: string;
    pluginType: PluginType;
    timeoutInMillisecond: number;
  }[];
}

function* apiCallForForkBuildingBlockToApplication(request: {
  templateId: string;
  activePageId: string;
  applicationId: string;
  workspaceId: string;
}) {
  try {
    const response: ApiResponse<ImportBuildingBlockToApplicationResponse> =
      yield call(ApplicationApi.importBuildingBlockToApplication, {
        pageId: request.activePageId,
        templateId: request.templateId,
        applicationId: request.applicationId,
        workspaceId: request.workspaceId,
      });
    const isValid: boolean = yield validateResponse(response);
    const layoutSystemType: LayoutSystemTypes =
      yield select(getLayoutSystemType);

    const allWidgets: CanvasWidgetsReduxState = yield select(getWidgets);
    yield select(getCanvasWidgets);

    if (isValid) {
      const buildingBlockDsl = JSON.parse(response.data.widgetDsl);
      const buildingBlockWidgets = buildingBlockDsl.children;
      const flattenedBlockWidgets = buildingBlockWidgets.map(
        (widget: WidgetProps) => flattenDSL(widget),
      );

      const widgetsToPasteInCanvas: CopiedWidgetData[] = yield all(
        flattenedBlockWidgets.map(
          (widget: FlattenedWidgetProps, index: number) => {
            let widgetPositionInfo: WidgetLayoutPositionInfo | null = null;
            if (
              widget.parentId &&
              layoutSystemType === LayoutSystemTypes.ANVIL
            ) {
              widgetPositionInfo = getWidgetLayoutMetaInfo(
                allWidgets[widget?.parentId]?.layout[0] ?? null,
                widget.widgetId,
              );
            }
            return {
              hierarchy: getWidgetHierarchy(
                buildingBlockWidgets[index].type,
                buildingBlockWidgets[index].widgetId,
              ),
              list: Object.values(widget)
                .map((obj) => ({ ...obj }))
                .reverse(),
              parentId: MAIN_CONTAINER_WIDGET_ID,
              widgetId: buildingBlockWidgets[index].widgetId,
              widgetPositionInfo,
            };
          },
        ),
      );

      yield saveCopiedWidgets(
        JSON.stringify({
          widgets: widgetsToPasteInCanvas,
          flexLayers: [],
        }),
      );

      yield put(pasteWidget(false, { x: 0, y: 0 }));
      yield call(postPageAdditionSaga, request.applicationId);
      // remove selecting of recently imported widgets
      yield put(selectWidgetInitAction(SelectionRequestType.Empty));

      // run all actions in the building block, if any, to populate the page with data
      if (
        response.data.onPageLoadActions &&
        response.data.onPageLoadActions.length > 0
      ) {
        yield all(
          response.data.onPageLoadActions.map(function* (action) {
            yield put(runAction(action.id));
          }),
        );
      }
      yield put({
        type: ReduxActionTypes.IMPORT_STARTER_TEMPLATE_TO_APPLICATION_SUCCESS,
      });

      // Show datasource prompt after 3 seconds
      yield delay(STARTER_BUILDING_BLOCKS.DATASOURCE_PROMPT_DELAY);
      yield put(showStarterBuildingBlockDatasourcePrompt(request.activePageId));
    } else {
      throw new Error("Failed importing starter building block");
    }
  } catch (error) {
    throw error;
  }
}

function* forkStarterBuildingBlockToApplicationSaga(
  action: ReduxAction<{
    pageNames?: string[];
    templateId: string;
    templateName: string;
  }>,
) {
  try {
    const activePageId: string = yield select(getCurrentPageId);
    const applicationId: string = yield select(getCurrentApplicationId);
    const workspaceId: string = yield select(getCurrentWorkspaceId);

    yield call(apiCallForForkBuildingBlockToApplication, {
      templateId: action.payload.templateId,
      activePageId,
      applicationId,
      workspaceId,
    });
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.IMPORT_STARTER_BUILDING_BLOCK_TO_APPLICATION_ERROR,
    });
  }
}

function* forkTemplateToApplicationSaga(
  action: ReduxAction<{
    pageNames?: string[];
    templateId: string;
    templateName: string;
  }>,
) {
  try {
    const {
      isValid,
    }: {
      isValid: boolean;
    } = yield call(apiCallForForkTemplateToApplicaion, action);
    if (isValid) {
      yield put(hideTemplatesModal());
      yield put(getAllTemplates());

      toast.show(
        `Pages from '${action.payload.templateName}' template added successfully`,
        {
          kind: "success",
        },
      );
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

function* apiCallForForkTemplateToApplicaion(
  action: ReduxAction<{
    templateId: string;
    templateName: string;
    pageNames?: string[] | undefined;
  }>,
) {
  const pagesToImport = action.payload.pageNames
    ? action.payload.pageNames
    : undefined;
  const applicationId: string = yield select(getCurrentApplicationId);
  const workspaceId: string = yield select(getCurrentWorkspaceId);
  const prevPageIds: string[] = yield select(getAllPageIds);
  const response: ImportTemplateResponse = yield call(
    TemplatesAPI.importTemplateToApplication,
    action.payload.templateId,
    applicationId,
    workspaceId,
    pagesToImport,
  );
  // To fetch the new set of pages after merging the template into the existing application
  yield put(
    fetchApplication({
      mode: APP_MODE.EDIT,
      applicationId,
    }),
  );
  const isValid: boolean = yield validateResponse(response);
  if (isValid) {
    yield call(postPageAdditionSaga, applicationId);
    const pages: string[] = yield select(getAllPageIds);
    const templatePageIds: string[] = pages.filter(
      (pageId) => !prevPageIds.includes(pageId),
    );
    const pageDSLs: unknown = yield all(
      templatePageIds.map((pageId: string) => {
        return call(fetchPageDSLSaga, pageId);
      }),
    );

    yield put({
      type: ReduxActionTypes.FETCH_PAGE_DSLS_SUCCESS,
      payload: pageDSLs,
    });

    yield put({
      type: ReduxActionTypes.UPDATE_PAGE_LIST,
      payload: pageDSLs,
    });
    if (response.data.isPartialImport) {
      yield put(
        showReconnectDatasourceModal({
          application: response.data.application,
          unConfiguredDatasourceList: response.data.unConfiguredDatasourceList,
          workspaceId,
          pageId: pages[0],
        }),
      );
    }
    history.push(
      builderURL({
        pageId: pages[0],
      }),
    );
    yield take(ReduxActionTypes.UPDATE_CANVAS_STRUCTURE);
    yield put(saveLayout());
    yield put({
      type: ReduxActionTypes.IMPORT_TEMPLATE_TO_APPLICATION_SUCCESS,
      payload: response.data.application,
    });
    return { isValid, applicationId, templatePageIds, prevPageIds };
  }
  return { isValid };
}

function* getTemplateFiltersSaga() {
  try {
    const response: TemplateFiltersResponse = yield call(
      TemplatesAPI.getTemplateFilters,
    );
    const isValid: boolean = yield validateResponse(response);
    if (isValid) {
      yield put({
        type: ReduxActionTypes.GET_TEMPLATE_FILTERS_SUCCESS,
        payload: response.data,
      });
    }
  } catch (e) {
    yield put({
      type: ReduxActionErrorTypes.GET_TEMPLATE_FILTERS_ERROR,
      payload: {
        e,
      },
    });
  }
}

function* forkTemplateToApplicationViaOnboardingFlowSaga(
  action: ReduxAction<{
    pageNames?: string[];
    templateId: string;
    templateName: string;
    applicationId: string;
    workspaceId: string;
  }>,
) {
  try {
    const response: ImportTemplateResponse = yield call(
      TemplatesAPI.importTemplateToApplication,
      action.payload.templateId,
      action.payload.applicationId,
      action.payload.workspaceId,
      action.payload.pageNames,
    );

    const isValid: boolean = yield validateResponse(response);
    if (isValid) {
      const application = response.data.application;
      urlBuilder.updateURLParams(
        {
          applicationSlug: application.slug,
          applicationVersion: application.applicationVersion,
          applicationId: application.id,
        },
        application.pages.map((page) => ({
          pageSlug: page.slug,
          customSlug: page.customSlug,
          pageId: page.id,
        })),
      );
      history.push(
        builderURL({
          pageId: application.pages[0].id,
        }),
      );

      // This is to remove the existing default Page 1 in the new application after template has been imported.
      // 1. Set new page as default
      const importedTemplatePages = application.pages.filter(
        (page) => !page.isDefault,
      );
      yield put({
        type: ReduxActionTypes.SET_DEFAULT_APPLICATION_PAGE_INIT,
        payload: {
          id: importedTemplatePages[0].id,
          applicationId: application.id,
        },
      });

      yield take(ReduxActionTypes.SET_DEFAULT_APPLICATION_PAGE_SUCCESS);

      const defaultPageId = application.pages.filter(
        (page) => page.isDefault,
      )[0].id;

      //2. Delete old default page (Page 1)
      yield put({
        type: ReduxActionTypes.DELETE_PAGE_INIT,
        payload: {
          id: defaultPageId,
        },
      });

      yield put({
        type: ReduxActionTypes.IMPORT_TEMPLATE_TO_APPLICATION_ONBOARDING_FLOW_SUCCESS,
        payload: response.data.application,
      });
      toast.show(
        `Pages from '${action.payload.templateName}' template added successfully`,
        {
          kind: "success",
        },
      );
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.IMPORT_TEMPLATE_TO_APPLICATION_ONBOARDING_FLOW_ERROR,
      payload: {
        error,
      },
    });
  }
}

// TODO: Refactor and handle this airgap check in a better way - posssibly in root sagas (sangeeth)
export default function* watchActionSagas() {
  if (!isAirgappedInstance)
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
      takeEvery(
        ReduxActionTypes.GET_TEMPLATE_FILTERS_INIT,
        getTemplateFiltersSaga,
      ),
      takeEvery(
        ReduxActionTypes.IMPORT_STARTER_BUILDING_BLOCK_TO_APPLICATION_INIT,
        forkStarterBuildingBlockToApplicationSaga,
      ),
      takeEvery(
        ReduxActionTypes.IMPORT_TEMPLATE_TO_APPLICATION_ONBOARDING_FLOW,
        forkTemplateToApplicationViaOnboardingFlowSaga,
      ),
    ]);
}
