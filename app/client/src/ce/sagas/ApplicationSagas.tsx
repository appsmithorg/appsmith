import type { ReduxAction } from "actions/ReduxActionTypes";
import {
  ReduxActionErrorTypes,
  ReduxActionTypes,
} from "ee/constants/ReduxActionConstants";
import type {
  ApplicationResponsePayload,
  ChangeAppViewAccessRequest,
  CreateApplicationRequest,
  CreateApplicationResponse,
  DeleteApplicationRequest,
  DeleteNavigationLogoRequest,
  FetchApplicationPayload,
  FetchApplicationResponse,
  FetchApplicationsOfWorkspaceResponse,
  FetchUnconfiguredDatasourceListResponse,
  FetchUsersApplicationsWorkspacesResponse,
  ForkApplicationRequest,
  ImportApplicationRequest,
  PublishApplicationRequest,
  PublishApplicationResponse,
  SetDefaultPageRequest,
  UpdateApplicationRequest,
  UpdateApplicationResponse,
  UploadNavigationLogoRequest,
} from "ee/api/ApplicationApi";
import ApplicationApi from "ee/api/ApplicationApi";
import { all, call, put, select, take } from "redux-saga/effects";

import { validateResponse } from "sagas/ErrorSagas";
import {
  getCurrentApplication,
  getCurrentApplicationIdForCreateNewApp,
} from "ee/selectors/applicationSelectors";
import type { ApiResponse } from "api/ApiResponses";
import history from "utils/history";
import type { AppState } from "ee/reducers";
import {
  ApplicationVersion,
  deleteApplicationNavigationLogoSuccessAction,
  fetchApplication,
  importApplicationSuccess,
  initDatasourceConnectionDuringImportSuccess,
  resetCurrentApplication,
  setDefaultApplicationPageSuccess,
  setIsReconnectingDatasourcesModalOpen,
  setPageIdForImport,
  setWorkspaceIdForImport,
  showReconnectDatasourceModal,
  updateApplicationNavigationLogoSuccessAction,
  updateApplicationNavigationSettingAction,
  updateCurrentApplicationEmbedSetting,
  updateCurrentApplicationIcon,
  updateCurrentApplicationForkingEnabled,
  updateApplicationThemeSettingAction,
  fetchAllApplicationsOfWorkspace,
  publishApplication,
} from "ee/actions/applicationActions";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";
import {
  createMessage,
  ERROR_IMPORTING_APPLICATION_TO_WORKSPACE,
  IMPORT_APP_SUCCESSFUL,
} from "ee/constants/messages";
import { APP_MODE } from "entities/App";
import type { Workspace } from "ee/constants/workspaceConstants";
import type { AppColorCode } from "constants/DefaultTheme";
import {
  getCurrentApplicationId,
  getCurrentBasePageId,
  getCurrentPageId,
  getIsEditorInitialized,
} from "selectors/editorSelectors";

import {
  deleteRecentAppEntities,
  getEnableStartSignposting,
} from "utils/storage";
import { getFetchedWorkspaces } from "ee/selectors/workspaceSelectors";

import { fetchPluginFormConfigs, fetchPlugins } from "actions/pluginActions";
import {
  fetchDatasources,
  setUnconfiguredDatasourcesDuringImport,
} from "actions/datasourceActions";
import { failFastApiCalls } from "sagas/InitSagas";
import type { Datasource } from "entities/Datasource";
import { builderURL, viewerURL } from "ee/RouteBuilder";
import { getDefaultPageId as selectDefaultPageId } from "sagas/selectors";
import PageApi from "api/PageApi";
import { isEmpty, merge } from "lodash";
import { checkAndGetPluginFormConfigsSaga } from "sagas/PluginSagas";
import { getPageList, getPluginForm } from "ee/selectors/entitiesSelector";
import { getConfigInitialValues } from "components/formControls/utils";
import DatasourcesApi from "ee/api/DatasourcesApi";
import type { SetDefaultPageActionPayload } from "actions/pageActions";
import { resetApplicationWidgets } from "actions/pageActions";
import { setCanvasCardsState } from "actions/editorActions";
import { toast } from "@appsmith/ads";
import type { User } from "constants/userConstants";
import { ANONYMOUS_USERNAME } from "constants/userConstants";
import { getCurrentUser } from "selectors/usersSelectors";
import { ERROR_CODES } from "ee/constants/ApiConstants";
import { safeCrashAppRequest } from "actions/errorActions";
import type { IconNames } from "@appsmith/ads";
import {
  defaultNavigationSetting,
  keysOfNavigationSetting,
  type NavigationSetting,
} from "constants/AppConstants";
import { setAllEntityCollapsibleStates } from "actions/editorContextActions";
import { getCurrentEnvironmentId } from "ee/selectors/environmentSelectors";
import { LayoutSystemTypes } from "layoutSystems/types";
import {
  getApplicationsOfWorkspace,
  getCurrentWorkspaceId,
} from "ee/selectors/selectedWorkspaceSelectors";
import equal from "fast-deep-equal";
import { getFromServerWhenNoPrefetchedResult } from "sagas/helper";
import type { Page } from "entities/Page";
import type { ApplicationPayload } from "entities/Application";
import { objectKeys } from "@appsmith/utils";
import { findDefaultPage } from "pages/utils";

export let windowReference: Window | null = null;

export function* publishApplicationSaga(
  requestAction: ReduxAction<PublishApplicationRequest>,
) {
  const currentApplication: ApplicationPayload | undefined = yield select(
    getCurrentApplication,
  );

  if (currentApplication) {
    const appName = currentApplication.name;
    const appId = currentApplication?.id;
    const pageCount = currentApplication?.pages?.length;
    const navigationSettingsWithPrefix: Record<
      string,
      NavigationSetting[keyof NavigationSetting]
    > = {};

    if (currentApplication.applicationDetail?.navigationSetting) {
      const settingKeys = objectKeys(
        currentApplication.applicationDetail.navigationSetting,
      ) as Array<keyof NavigationSetting>;

      settingKeys.map((key: keyof NavigationSetting) => {
        if (currentApplication.applicationDetail?.navigationSetting?.[key]) {
          const value: NavigationSetting[keyof NavigationSetting] =
            currentApplication.applicationDetail.navigationSetting[key];

          navigationSettingsWithPrefix[`navigationSetting_${key}`] = value;
        }
      });
    }

    AnalyticsUtil.logEvent("PUBLISH_APP", {
      appId,
      appName,
      pageCount,
      ...navigationSettingsWithPrefix,
      isPublic: !!currentApplication?.isPublic,
      templateTitle: currentApplication?.forkedFromTemplateTitle,
    });
  }

  try {
    const request = requestAction.payload;
    const response: PublishApplicationResponse = yield call(
      ApplicationApi.publishApplication,
      request,
    );
    const isValidResponse: boolean = yield validateResponse(response);

    if (isValidResponse) {
      yield put({
        type: ReduxActionTypes.PUBLISH_APPLICATION_SUCCESS,
      });

      const applicationId: string = yield select(getCurrentApplicationId);
      const currentBasePageId: string = yield select(getCurrentBasePageId);
      const currentPageId: string = yield select(getCurrentPageId);

      const appicationViewPageUrl = viewerURL({
        basePageId: currentBasePageId,
      });

      yield put(
        fetchApplication({
          applicationId,
          pageId: currentPageId,
          mode: APP_MODE.EDIT,
        }),
      );

      // If the tab is opened focus and reload else open in new tab
      if (!windowReference || windowReference.closed) {
        windowReference = window.open(appicationViewPageUrl, "_blank");
      } else {
        windowReference.focus();
        windowReference.location.href =
          windowReference.location.origin + appicationViewPageUrl;
      }
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.PUBLISH_APPLICATION_ERROR,
      payload: {
        error,
      },
    });
  }
}

export function* fetchAllApplicationsOfWorkspaceSaga(
  action?: ReduxAction<string>,
) {
  let activeWorkspaceId: string = "";

  if (!action?.payload) {
    activeWorkspaceId = yield select(getCurrentWorkspaceId);
  } else {
    activeWorkspaceId = action.payload;
  }

  try {
    const response: FetchApplicationsOfWorkspaceResponse = yield call(
      ApplicationApi.fetchAllApplicationsOfWorkspace,
      activeWorkspaceId,
    );
    const workspaces: Workspace[] = yield select(getFetchedWorkspaces);
    const isOnboardingApplicationId: string = yield select(
      getCurrentApplicationIdForCreateNewApp,
    );
    const isValidResponse: boolean = yield validateResponse(response);

    if (isValidResponse) {
      const applications = response.data.map((application) => {
        const defaultPage = findDefaultPage(application.pages);

        return {
          ...application,
          defaultPageId: defaultPage?.id,
          defaultBasePageId: defaultPage?.baseId,
        };
      });

      yield put({
        type: ReduxActionTypes.FETCH_ALL_APPLICATIONS_OF_WORKSPACE_SUCCESS,
        payload: applications,
      });

      // This will initialise the current workspace to first only during onboarding
      if (workspaces.length > 0 && !!isOnboardingApplicationId) {
        yield put({
          type: ReduxActionTypes.SET_CURRENT_WORKSPACE,
          payload: workspaces[0],
        });
      }
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.FETCH_USER_APPLICATIONS_WORKSPACES_ERROR,
      payload: {
        error,
      },
    });
  }
}

// v1
export function* fetchAppAndPagesSaga(
  action: ReduxAction<FetchApplicationPayload>,
) {
  try {
    const { pages, ...payload } = action.payload;
    const request = { ...payload };

    if (request.pageId && request.applicationId) {
      delete request.applicationId;
    }

    const response: FetchApplicationResponse = yield call(
      getFromServerWhenNoPrefetchedResult,
      pages,
      () => call(PageApi.fetchAppAndPages, request),
    );

    const isValidResponse: boolean = yield call(validateResponse, response);

    if (isValidResponse) {
      const prevPagesState: Page[] = yield select(getPageList);
      const pagePermissionsMap = prevPagesState.reduce(
        (acc, page) => {
          acc[page.pageId] = page.userPermissions ?? [];

          return acc;
        },
        {} as Record<string, string[]>,
      );

      yield put({
        type: ReduxActionTypes.FETCH_APPLICATION_SUCCESS,
        payload: { ...response.data.application, pages: response.data.pages },
      });

      yield put({
        type: ReduxActionTypes.FETCH_PAGE_LIST_SUCCESS,
        payload: {
          pages: response.data.pages.map((page) => ({
            pageName: page.name,
            pageId: page.id,
            basePageId: page.baseId,
            isDefault: page.isDefault,
            isHidden: !!page.isHidden,
            slug: page.slug,
            customSlug: page.customSlug,
            userPermissions: page.userPermissions
              ? page.userPermissions
              : pagePermissionsMap[page.id],
          })),
          applicationId: response.data.application?.id,
          baseApplicationId: response.data.application?.baseId,
        },
      });

      yield put({
        type: ReduxActionTypes.SET_CURRENT_WORKSPACE_ID,
        payload: {
          workspaceId: response.data.workspaceId,
          editorId: response.data.application?.id,
          mode: request.mode,
        },
      });

      yield put({
        type: ReduxActionTypes.SET_APP_VERSION_ON_WORKER,
        payload: response.data.application?.evaluationVersion,
      });
    } else {
      yield call(handleFetchApplicationError, response.responseMeta?.error);
    }
  } catch (error) {
    yield call(handleFetchApplicationError, error);
  }
}

// TODO: Fix this the next time the file is edited
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function* handleFetchApplicationError(error: any) {
  const currentUser: User = yield select(getCurrentUser);

  if (
    currentUser &&
    currentUser.email === ANONYMOUS_USERNAME &&
    error?.code === ERROR_CODES.PAGE_NOT_FOUND
  ) {
    yield put(safeCrashAppRequest(ERROR_CODES.PAGE_NOT_FOUND));
  } else {
    yield put({
      type: ReduxActionErrorTypes.FETCH_APPLICATION_ERROR,
      payload: {
        error,
      },
    });
    yield put({
      type: ReduxActionErrorTypes.FETCH_PAGE_LIST_ERROR,
      payload: {
        error,
      },
    });
  }
}

export function* setDefaultApplicationPageSaga(
  action: ReduxAction<SetDefaultPageActionPayload>,
) {
  try {
    const defaultPageId: string = yield select(selectDefaultPageId);

    if (defaultPageId !== action.payload.id) {
      const request: SetDefaultPageRequest = {
        ...action.payload,
        pageId: action.payload.id,
      };
      const response: ApiResponse = yield call(
        ApplicationApi.setDefaultApplicationPage,
        request,
      );
      const isValidResponse: boolean = yield validateResponse(response);

      if (isValidResponse) {
        yield put(
          setDefaultApplicationPageSuccess(
            request.pageId,
            request.applicationId,
          ),
        );
      }
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.SET_DEFAULT_APPLICATION_PAGE_ERROR,
      payload: {
        error,
      },
    });
  }
}

export function* updateApplicationLayoutSaga(
  action: ReduxAction<UpdateApplicationRequest>,
) {
  try {
    yield call(updateApplicationSaga, action);
    yield put({
      type: ReduxActionTypes.CURRENT_APPLICATION_LAYOUT_UPDATE,
      payload: action.payload.appLayout,
    });
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.UPDATE_APP_LAYOUT_ERROR,
      payload: {
        error,
      },
    });
  }
}

export function* updateApplicationSaga(
  action: ReduxAction<UpdateApplicationRequest>,
) {
  try {
    const request: UpdateApplicationRequest = action.payload;
    const response: ApiResponse<UpdateApplicationResponse> = yield call(
      ApplicationApi.updateApplication,
      request,
    );
    const isValidResponse: boolean = yield validateResponse(response);

    // as the redux store updates the app only on success.
    // we have to run this
    if (isValidResponse) {
      if (request && request.applicationVersion) {
        if (request.applicationVersion === ApplicationVersion.SLUG_URL) {
          request.callback?.();

          return;
        }
      }

      if (request) {
        yield put({
          type: ReduxActionTypes.UPDATE_APPLICATION_SUCCESS,
          payload: response.data,
        });
      }

      if (request.currentApp) {
        if (request.name)
          yield put({
            type: ReduxActionTypes.CURRENT_APPLICATION_NAME_UPDATE,
            payload: response.data,
          });

        if (request.icon) {
          yield put(updateCurrentApplicationIcon(response.data.icon));
        }

        if (request.embedSetting) {
          yield put(
            updateCurrentApplicationEmbedSetting(response.data.embedSetting),
          );
        }

        if ("forkingEnabled" in request) {
          yield put(
            updateCurrentApplicationForkingEnabled(
              response.data.forkingEnabled,
            ),
          );
        }

        if (
          request.applicationDetail?.navigationSetting &&
          response.data.applicationDetail?.navigationSetting
        ) {
          yield put(
            updateApplicationNavigationSettingAction(
              response.data.applicationDetail.navigationSetting,
            ),
          );
        }

        // TODO: refactor this once backend is ready
        if (request.applicationDetail?.themeSetting) {
          yield put(
            updateApplicationThemeSettingAction(
              request.applicationDetail?.themeSetting,
            ),
          );
        }
      }
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.UPDATE_APPLICATION_ERROR,
      payload: {
        error,
      },
    });
  }
}

export function* deleteApplicationSaga(
  action: ReduxAction<DeleteApplicationRequest>,
) {
  try {
    const request: DeleteApplicationRequest = action.payload;
    const response: ApiResponse = yield call(
      ApplicationApi.deleteApplication,
      request,
    );
    const isValidResponse: boolean = yield validateResponse(response);

    if (isValidResponse) {
      yield put({
        type: ReduxActionTypes.DELETE_APPLICATION_SUCCESS,
        payload: response.data,
      });
      yield call(deleteRecentAppEntities, request.applicationId);
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.DELETE_APPLICATION_ERROR,
      payload: {
        error,
      },
    });
  }
}

export function* changeAppViewAccessSaga(
  requestAction: ReduxAction<ChangeAppViewAccessRequest>,
) {
  try {
    const request = requestAction.payload;
    const response: ApiResponse = yield call(
      ApplicationApi.changeAppViewAccess,
      request,
    );
    const isValidResponse: boolean = yield validateResponse(response);

    if (isValidResponse) {
      yield put({
        type: ReduxActionTypes.CHANGE_APPVIEW_ACCESS_SUCCESS,
        payload: {
          // @ts-expect-error: response is of type unknown
          id: response.data.id,
          // @ts-expect-error: response is of type unknown
          isPublic: response.data.isPublic,
        },
      });
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.CHANGE_APPVIEW_ACCESS_ERROR,
      payload: {
        error,
      },
    });
  }
}

export function* createApplicationSaga(
  action: ReduxAction<{
    applicationName: string;
    icon: IconNames;
    color: AppColorCode;
    workspaceId: string;
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolve: any;
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    reject: any;
  }>,
) {
  const { applicationName, color, icon, reject, workspaceId } = action.payload;

  try {
    const applications: Workspace[] = yield select(getApplicationsOfWorkspace);
    const existingApplication = applications
      ? applications.find((application) => application.name === applicationName)
      : null;

    if (existingApplication) {
      yield call(reject, {
        _error: "An application with this name already exists",
      });
      yield put({
        type: ReduxActionErrorTypes.CREATE_APPLICATION_ERROR,
        payload: {
          error: "Could not create application",
          show: false,
        },
      });
    } else {
      yield put(resetCurrentApplication());

      const request: CreateApplicationRequest = {
        name: applicationName,
        icon: icon,
        color: color,
        workspaceId,
        layoutSystemType: LayoutSystemTypes.FIXED, // Note: This may be provided as an action payload in the future
      };

      const response: CreateApplicationResponse = yield call(
        ApplicationApi.createApplication,
        request,
      );
      const isValidResponse: boolean = yield validateResponse(response);

      if (isValidResponse) {
        const defaultPage = findDefaultPage(response.data.pages);
        const application: ApplicationPayload = {
          ...response.data,
          defaultPageId: defaultPage?.id,
          defaultBasePageId: defaultPage?.baseId,
        };

        AnalyticsUtil.logEvent("CREATE_APP", {
          appName: application.name,
        });
        // This sets ui.pageWidgets = {} to ensure that
        // widgets are cleaned up from state before
        // finishing creating a new application
        yield put(resetApplicationWidgets());
        yield put({
          type: ReduxActionTypes.CREATE_APPLICATION_SUCCESS,
          payload: {
            workspaceId,
            application,
          },
        });

        // All new apps will have the Entity Explorer unfurled so that users
        // can find the entities they have created
        yield put(
          setAllEntityCollapsibleStates({
            Widgets: true,
            ["Queries/JS"]: true,
            Datasources: true,
          }),
        );

        const enableSignposting: boolean | null =
          yield getEnableStartSignposting();

        if (enableSignposting) {
          yield put({
            type: ReduxActionTypes.SET_FIRST_TIME_USER_ONBOARDING_APPLICATION_ID,
            payload: application.id,
          });
        }

        yield put(setCanvasCardsState(defaultPage?.id ?? ""));
        history.push(
          builderURL({
            basePageId: defaultPage?.baseId,
          }),
        );
      }
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.CREATE_APPLICATION_ERROR,
      payload: {
        error,
        show: false,
        workspaceId,
      },
    });
  }
}

export function* forkApplicationSaga(
  action: ReduxAction<ForkApplicationRequest>,
) {
  try {
    const response: ApiResponse<{
      application: ApplicationResponsePayload;
      isPartialImport: boolean;
      unConfiguredDatasourceList: Datasource[];
    }> = yield call(ApplicationApi.forkApplication, {
      applicationId: action.payload.applicationId,
      workspaceId: action.payload.workspaceId,
    });
    const isValidResponse: boolean = yield validateResponse(response);

    if (isValidResponse) {
      yield put(resetCurrentApplication());
      const defaultPage = findDefaultPage(response.data.application.pages);
      const application: ApplicationPayload = {
        ...response.data.application,
        defaultPageId: defaultPage?.id,
        defaultBasePageId: defaultPage?.baseId,
      };

      yield put({
        type: ReduxActionTypes.FORK_APPLICATION_SUCCESS,
        payload: {
          workspaceId: action.payload.workspaceId,
          application,
        },
      });
      yield put({
        type: ReduxActionTypes.SET_CURRENT_WORKSPACE_ID,
        payload: {
          workspaceId: action.payload.workspaceId,
          editorId: application.id,
        },
      });

      const pageURL = builderURL({
        basePageId: defaultPage?.baseId,
        params: { branch: null },
      });

      if (action.payload.editMode) {
        yield put({
          type: ReduxActionTypes.FETCH_APPLICATION_INIT,
          payload: {
            applicationId: application.id,
            pageId: defaultPage?.id,
          },
        });
      }

      history.push(pageURL);

      const isEditorInitialized: boolean = yield select(getIsEditorInitialized);

      if (!isEditorInitialized) {
        yield take(ReduxActionTypes.INITIALIZE_EDITOR_SUCCESS);
      }

      if (response.data.isPartialImport) {
        yield put(
          showReconnectDatasourceModal({
            application: response.data?.application,
            unConfiguredDatasourceList:
              response?.data.unConfiguredDatasourceList,
            workspaceId: action.payload.workspaceId,
          }),
        );
      }
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.FORK_APPLICATION_ERROR,
      payload: {
        error,
      },
    });
  }
}

export function* showReconnectDatasourcesModalSaga(
  action: ReduxAction<{
    application: ApplicationResponsePayload;
    unConfiguredDatasourceList: Array<Datasource>;
    workspaceId: string;
    pageId?: string;
  }>,
) {
  const { application, pageId, unConfiguredDatasourceList, workspaceId } =
    action.payload;

  yield put(fetchAllApplicationsOfWorkspace());
  yield put(importApplicationSuccess(application));
  yield put(fetchPlugins({ workspaceId }));

  yield put(
    setUnconfiguredDatasourcesDuringImport(unConfiguredDatasourceList || []),
  );

  yield put(setWorkspaceIdForImport({ editorId: application.id, workspaceId }));
  yield put(setPageIdForImport(pageId));
  yield put(setIsReconnectingDatasourcesModalOpen({ isOpen: true }));
}

export function* importApplicationSaga(
  action: ReduxAction<ImportApplicationRequest>,
) {
  try {
    const response: ApiResponse = yield call(
      ApplicationApi.importApplicationToWorkspace,
      action.payload,
    );
    const urlObject = new URL(window.location.href);
    const isApplicationUrl = urlObject.pathname.includes("/app/");
    const isValidResponse: boolean = yield validateResponse(response);

    if (isValidResponse) {
      const currentWorkspaceId: string = yield select(getCurrentWorkspaceId);
      const allWorkspaces: Workspace[] = yield select(getFetchedWorkspaces);
      const currentWorkspace = allWorkspaces.filter(
        (el: Workspace) => el.id === action.payload.workspaceId,
      );

      if (currentWorkspaceId || currentWorkspace.length > 0) {
        const {
          // @ts-expect-error: response is of type unknown
          application: { pages },
          // @ts-expect-error: response is of type unknown
          isPartialImport,
        } = response.data;

        // @ts-expect-error: response is of type unknown
        yield put(importApplicationSuccess(response.data?.application));

        if (isPartialImport) {
          yield put(
            showReconnectDatasourceModal({
              // @ts-expect-error: response is of type unknown
              application: response.data?.application,
              unConfiguredDatasourceList:
                // @ts-expect-error: response is of type unknown
                response?.data.unConfiguredDatasourceList,
              workspaceId: action.payload.workspaceId,
            }),
          );
        } else {
          // @ts-expect-error: pages is of type any
          // TODO: Update route params here
          const { application } = response.data;
          const defaultPage = findDefaultPage(pages);
          const pageURL = builderURL({
            basePageId: defaultPage?.baseId,
          });

          if (isApplicationUrl) {
            const appId = application.id;
            const pageId = application.defaultPageId;

            yield put({
              type: ReduxActionTypes.FETCH_APPLICATION_INIT,
              payload: {
                applicationId: appId,
                pageId,
              },
            });
          }

          history.push(pageURL);

          toast.show(createMessage(IMPORT_APP_SUCCESSFUL), {
            kind: "success",
          });
        }
      } else {
        yield put({
          type: ReduxActionErrorTypes.IMPORT_APPLICATION_ERROR,
          payload: {
            error: createMessage(ERROR_IMPORTING_APPLICATION_TO_WORKSPACE),
          },
        });
      }
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.IMPORT_APPLICATION_ERROR,
      payload: {
        error,
      },
    });
  }
}

export function* fetchReleases() {
  try {
    const response: FetchUsersApplicationsWorkspacesResponse = yield call(
      ApplicationApi.getReleaseItems,
    );
    const isValidResponse: boolean = yield validateResponse(response);

    if (isValidResponse) {
      const { newReleasesCount, releaseItems } = response.data || {};

      yield put({
        type: ReduxActionTypes.FETCH_RELEASES_SUCCESS,
        payload: { newReleasesCount, releaseItems },
      });
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.FETCH_RELEASES_ERROR,
      payload: {
        error,
      },
    });
  }
}

export function* fetchUnconfiguredDatasourceList(
  action: ReduxAction<{
    applicationId: string;
    workspaceId: string;
  }>,
) {
  try {
    // Get endpoint based on app mode
    const response: FetchUnconfiguredDatasourceListResponse = yield call(
      ApplicationApi.fetchUnconfiguredDatasourceList,
      action.payload,
    );

    yield put(setUnconfiguredDatasourcesDuringImport(response.data || []));
  } catch (error) {
    yield put(setUnconfiguredDatasourcesDuringImport([]));
    yield put({
      type: ReduxActionErrorTypes.FETCH_APPLICATION_ERROR,
      payload: {
        error,
      },
    });
  }
}

export function* initializeDatasourceWithDefaultValues(datasource: Datasource) {
  let currentEnvironment: string = yield select(getCurrentEnvironmentId);

  if (!datasource.datasourceStorages.hasOwnProperty(currentEnvironment)) {
    // if the currentEnvironemnt is not present for use here, take the first key from datasourceStorages
    currentEnvironment = Object.keys(datasource.datasourceStorages)[0];
  }

  const dsStorage = datasource.datasourceStorages[currentEnvironment];

  if (!dsStorage?.isConfigured) {
    yield call(checkAndGetPluginFormConfigsSaga, datasource.pluginId);
    const formConfig: Record<string, unknown>[] = yield select(
      getPluginForm,
      datasource.pluginId,
    );
    const initialValues: unknown = yield call(
      getConfigInitialValues,
      formConfig,
      false,
      false,
    );
    const payload = merge(initialValues, dsStorage);

    payload.isConfigured = false; // imported datasource as not configured yet

    let isDSValueUpdated = false;

    if (isEmpty(dsStorage.datasourceConfiguration)) {
      isDSValueUpdated = true;
    } else {
      isDSValueUpdated = !equal(payload, dsStorage);
    }

    if (isDSValueUpdated) {
      const response: ApiResponse =
        yield DatasourcesApi.updateDatasourceStorage(payload);
      const isValidResponse: boolean = yield validateResponse(response);

      if (isValidResponse) {
        yield put({
          type: ReduxActionTypes.UPDATE_DATASOURCE_IMPORT_SUCCESS,
          payload: response.data,
        });
      }
    }
  }
}

export function* initDatasourceConnectionDuringImport(
  action: ReduxAction<{
    workspaceId: string;
    isPartialImport?: boolean;
  }>,
) {
  const workspaceId = action.payload.workspaceId;

  const pluginsAndDatasourcesCalls: boolean = yield failFastApiCalls(
    [fetchPlugins({ workspaceId }), fetchDatasources({ workspaceId })],
    [
      ReduxActionTypes.FETCH_PLUGINS_SUCCESS,
      ReduxActionTypes.FETCH_DATASOURCES_SUCCESS,
    ],
    [
      ReduxActionErrorTypes.FETCH_PLUGINS_ERROR,
      ReduxActionErrorTypes.FETCH_DATASOURCES_ERROR,
    ],
  );

  if (!pluginsAndDatasourcesCalls) return;

  const pluginFormCall: boolean = yield failFastApiCalls(
    [fetchPluginFormConfigs()],
    [ReduxActionTypes.FETCH_PLUGIN_FORM_CONFIGS_SUCCESS],
    [ReduxActionErrorTypes.FETCH_PLUGIN_FORM_CONFIGS_ERROR],
  );

  if (!pluginFormCall) return;

  const datasources: Datasource[] = yield select((state: AppState) => {
    return state.entities.datasources.list;
  });

  yield all(
    datasources.map((datasource: Datasource) =>
      call(initializeDatasourceWithDefaultValues, datasource),
    ),
  );

  if (!action.payload.isPartialImport) {
    // This is required for reconnect datasource modal popup
    yield put(initDatasourceConnectionDuringImportSuccess());
  }
}

export function* uploadNavigationLogoSaga(
  action: ReduxAction<UploadNavigationLogoRequest>,
) {
  try {
    const request: UploadNavigationLogoRequest = action.payload;
    const response: ApiResponse<UpdateApplicationResponse> = yield call(
      ApplicationApi.uploadNavigationLogo,
      request,
    );
    const isValidResponse: boolean = yield validateResponse(response);

    if (isValidResponse) {
      if (request.logo) {
        if (
          request.logo &&
          response.data.applicationDetail?.navigationSetting?.logoAssetId
        ) {
          yield put(
            updateApplicationNavigationLogoSuccessAction(
              response.data.applicationDetail.navigationSetting.logoAssetId,
            ),
          );

          /**
           * When the user creates a new application and they upload logo without
           * interacting with any other navigation settings first, we get only
           * navigationSetting = { logoAssetId: <id_string_here> } in the API response.
           *
           * Therefore, we need to handle this case by hitting the update application
           * API and store the default navigation settings as well alongside
           * the logoAssetId.
           */
          const navigationSettingKeys = Object.keys(
            response.data.applicationDetail?.navigationSetting,
          );

          if (
            navigationSettingKeys?.length === 1 &&
            navigationSettingKeys?.[0] === keysOfNavigationSetting.logoAssetId
          ) {
            const newUpdateApplicationRequestWithDefaultNavigationSettings = {
              ...response.data,
              applicationDetail: {
                ...response.data.applicationDetail,
                navigationSetting: {
                  ...defaultNavigationSetting,
                  ...response.data.applicationDetail.navigationSetting,
                },
              },
            };

            const updateApplicationResponse: ApiResponse<UpdateApplicationResponse> =
              yield call(
                ApplicationApi.updateApplication,
                newUpdateApplicationRequestWithDefaultNavigationSettings,
              );

            if (updateApplicationResponse?.data) {
              yield put({
                type: ReduxActionTypes.UPDATE_APPLICATION_SUCCESS,
                payload: updateApplicationResponse.data,
              });

              if (
                newUpdateApplicationRequestWithDefaultNavigationSettings
                  .applicationDetail?.navigationSetting &&
                updateApplicationResponse.data.applicationDetail
                  ?.navigationSetting
              ) {
                yield put(
                  updateApplicationNavigationSettingAction(
                    updateApplicationResponse.data.applicationDetail
                      .navigationSetting,
                  ),
                );
              }
            }
          }
        }
      }
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.UPLOAD_NAVIGATION_LOGO_ERROR,
      payload: {
        error,
      },
    });
  }
}

export function* deleteNavigationLogoSaga(
  action: ReduxAction<DeleteNavigationLogoRequest>,
) {
  try {
    const request: DeleteNavigationLogoRequest = action.payload;

    yield call(ApplicationApi.deleteNavigationLogo, request);
    yield put(deleteApplicationNavigationLogoSuccessAction());
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.DELETE_NAVIGATION_LOGO_ERROR,
      payload: {
        error,
      },
    });
  }
}

export function* publishAnvilApplicationSaga(
  action: ReduxAction<PublishApplicationRequest>,
) {
  try {
    yield put(publishApplication(action.payload.applicationId));
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.PUBLISH_ANVIL_APPLICATION_ERROR,
      payload: {
        error,
      },
    });
  }
}
