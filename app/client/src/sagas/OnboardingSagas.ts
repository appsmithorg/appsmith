import type { ReduxAction } from "@appsmith/constants/ReduxActionConstants";
import {
  ReduxActionTypes,
  WidgetReduxActionTypes,
} from "@appsmith/constants/ReduxActionConstants";
import {
  all,
  call,
  delay,
  put,
  select,
  take,
  takeLatest,
} from "redux-saga/effects";
import {
  getFirstTimeUserOnboardingApplicationIds,
  getFirstTimeUserOnboardingTelemetryCalloutIsAlreadyShown,
  removeAllFirstTimeUserOnboardingApplicationIds,
  removeFirstTimeUserOnboardingApplicationId,
  setEnableStartSignposting,
  setFirstTimeUserOnboardingApplicationId as storeFirstTimeUserOnboardingApplicationId,
  setFirstTimeUserOnboardingIntroModalVisibility as storeFirstTimeUserOnboardingIntroModalVisibility,
} from "utils/storage";

import { getCurrentUser } from "selectors/usersSelectors";
import history from "utils/history";

import {
  getHadReachedStep,
  getOnboardingWorkspaces,
  getQueryAction,
  getSignpostingStepStateByStep,
  getTableWidget,
} from "selectors/onboardingSelectors";
import type { Workspaces } from "@appsmith/constants/workspaceConstants";
import {
  disableStartSignpostingAction,
  enableGuidedTour,
  focusWidgetProperty,
  loadGuidedTour,
  removeFirstTimeUserOnboardingApplicationId as removeFirstTimeUserOnboardingApplicationIdAction,
  setCurrentStep,
  setSignpostingOverlay,
  showSignpostingTooltip,
  signpostingStepUpdate,
  toggleLoader,
} from "actions/onboardingActions";
import {
  getCurrentApplicationId,
  getIsEditorInitialized,
} from "selectors/editorSelectors";
import type { WidgetProps } from "widgets/BaseWidget";
import { getNextWidgetName } from "./WidgetOperationUtils";
import WidgetFactory from "WidgetProvider/factory";
import { generateReactKey } from "utils/generators";
import { RenderModes } from "constants/WidgetConstants";
import log from "loglevel";
import { getDataTree } from "selectors/dataTreeSelectors";
import { getWidgets } from "./selectors";
import {
  clearActionResponse,
  updateActionData,
} from "actions/pluginActionActions";
import {
  importApplication,
  updateApplicationLayout,
} from "@appsmith/actions/applicationActions";
import { setPreviewModeAction } from "actions/editorActions";
import type { FlattenedWidgetProps } from "WidgetProvider/constants";
import type { ActionData } from "@appsmith/reducers/entityReducers/actionsReducer";
import { batchUpdateMultipleWidgetProperties } from "actions/controlActions";
import {
  setExplorerActiveAction,
  setExplorerPinnedAction,
} from "actions/explorerActions";
import { selectWidgetInitAction } from "actions/widgetSelectionActions";
import { hideIndicator } from "pages/Editor/GuidedTour/utils";
import { updateWidgetName } from "actions/propertyPaneActions";
import AnalyticsUtil from "utils/AnalyticsUtil";
import type { DataTree } from "entities/DataTree/dataTreeTypes";
import type { CanvasWidgetsReduxState } from "reducers/entityReducers/canvasWidgetsReducer";
import type { User } from "constants/userConstants";
import { builderURL, queryEditorIdURL } from "@appsmith/RouteBuilder";
import { GuidedTourEntityNames } from "pages/Editor/GuidedTour/constants";
import type { GuidedTourState } from "reducers/uiReducers/guidedTourReducer";
import { sessionStorage } from "utils/localStorage";
import { SelectionRequestType } from "sagas/WidgetSelectUtils";
import type { SIGNPOSTING_STEP } from "pages/Editor/FirstTimeUserOnboarding/Utils";
import type { StepState } from "reducers/uiReducers/onBoardingReducer";
import { isUndefined } from "lodash";
import { isAirgapped } from "@appsmith/utils/airgapHelpers";
import { SIGNPOSTING_ANALYTICS_STEP_NAME } from "pages/Editor/FirstTimeUserOnboarding/constants";

const GUIDED_TOUR_STORAGE_KEY = "GUIDED_TOUR_STORAGE_KEY";

function* createApplication() {
  // If we are starting onboarding from the editor wait for the editor to reset.
  const isEditorInitialised: boolean = yield select(getIsEditorInitialized);
  let userWorkspaces: Workspaces[] = yield select(getOnboardingWorkspaces);
  if (isEditorInitialised) {
    yield take(ReduxActionTypes.RESET_EDITOR_SUCCESS);

    // If we haven't fetched the workspace list yet we wait for it to complete
    // as we need an workspace where we create an application
    if (!userWorkspaces.length) {
      yield take(ReduxActionTypes.FETCH_USER_APPLICATIONS_WORKSPACES_SUCCESS);
    }
  }

  userWorkspaces = yield select(getOnboardingWorkspaces);
  const currentUser: User | undefined = yield select(getCurrentUser);
  // @ts-expect-error: currentUser can be undefined
  const currentWorkspaceId = currentUser.currentWorkspaceId;
  let workspace;
  if (!currentWorkspaceId) {
    workspace = userWorkspaces[0];
  } else {
    const filteredWorkspaces = userWorkspaces.filter(
      (workspace: any) => workspace.workspace.id === currentWorkspaceId,
    );
    workspace = filteredWorkspaces[0];
  }

  if (workspace) {
    const TourAppPromise = import("pages/Editor/GuidedTour/app.json");
    const TourApp: Awaited<typeof TourAppPromise> = yield TourAppPromise;

    const appFileObject = new File([JSON.stringify(TourApp)], "app.json", {
      type: "application/json",
    });
    yield put(enableGuidedTour(true));
    yield put(
      importApplication({
        workspaceId: workspace.workspace.id,
        applicationFile: appFileObject,
      }),
    );
  }

  yield put(setPreviewModeAction(true));
}

function* syncGuidedTourStateSaga() {
  const applicationId: string = yield select(getCurrentApplicationId);
  const guidedTourState: GuidedTourState = yield select(
    (state) => state.ui.guidedTour,
  );
  yield call(
    sessionStorage.setItem,
    GUIDED_TOUR_STORAGE_KEY,
    JSON.stringify({ applicationId, guidedTourState }),
  );
}

function* loadGuidedTourInitSaga() {
  const applicationId: string = yield select(getCurrentApplicationId);
  const guidedTourState: undefined | string = yield call(
    sessionStorage.getItem,
    GUIDED_TOUR_STORAGE_KEY,
  );
  if (guidedTourState) {
    const parsedGuidedTourState: {
      applicationId: string;
      guidedTourState: GuidedTourState;
    } = JSON.parse(guidedTourState);

    if (applicationId === parsedGuidedTourState.applicationId) {
      yield put(loadGuidedTour(parsedGuidedTourState.guidedTourState));
    }
  }
}

function* setCurrentStepSaga(action: ReduxAction<number>) {
  const hadReachedStep: number = yield select(getHadReachedStep);
  // Log only once when we reach that step
  if (action.payload > hadReachedStep) {
    AnalyticsUtil.logEvent("GUIDED_TOUR_REACHED_STEP", {
      step: action.payload,
    });
  }

  yield call(syncGuidedTourStateSaga);
  yield put(setCurrentStep(action.payload));
}

function* setUpTourAppSaga() {
  yield put(setPreviewModeAction(false));
  // Delete the container widget
  const widgets: { [widgetId: string]: FlattenedWidgetProps } =
    yield select(getWidgets);
  const containerWidget = Object.values(widgets).find(
    (widget) => widget.type === "CONTAINER_WIDGET",
  );
  yield put({
    type: WidgetReduxActionTypes.WIDGET_DELETE,
    payload: {
      widgetId: containerWidget?.widgetId,
      parentId: containerWidget?.parentId,
      disallowUndo: true,
    },
  });

  yield delay(500);
  // @ts-expect-error: No type declared for getTableWidgetSelector.
  const tableWidget = yield select(getTableWidget);
  yield put(
    batchUpdateMultipleWidgetProperties([
      {
        widgetId: tableWidget.widgetId,
        updates: {
          modify: {
            tableData: "",
          },
        },
      },
    ]),
  );
  // Update getCustomers query body
  const query: ActionData | undefined = yield select(getQueryAction);
  yield put(clearActionResponse(query?.config.id ?? ""));
  yield put(
    updateActionData([
      {
        entityName: query?.config.name || "",
        dataPath: "data",
        data: undefined,
      },
    ]),
  );
  const applicationId: string = yield select(getCurrentApplicationId);
  yield put(
    updateApplicationLayout(applicationId || "", {
      appLayout: {
        type: "DESKTOP",
      },
    }),
  );
  if (!query) return;
  history.push(
    queryEditorIdURL({
      pageId: query.config.pageId,
      queryId: query.config.id,
    }),
  );
  // Hide the explorer initialy
  yield put(setExplorerPinnedAction(false));
  yield put(setExplorerActiveAction(false));
  yield put(toggleLoader(false));
}

function* addOnboardingWidget(action: ReduxAction<Partial<WidgetProps>>) {
  const widgetConfig = action.payload;

  if (!widgetConfig.type) return;

  const defaultConfig = WidgetFactory.widgetConfigMap.get(widgetConfig.type);

  const evalTree: DataTree = yield select(getDataTree);
  const widgets: CanvasWidgetsReduxState = yield select(getWidgets);

  const widgetName = getNextWidgetName(widgets, widgetConfig.type, evalTree, {
    prefix: widgetConfig.widgetName,
  });

  try {
    const newWidget = {
      newWidgetId: generateReactKey(),
      widgetId: "0",
      parentId: "0",
      renderMode: RenderModes.CANVAS,
      isLoading: false,
      ...defaultConfig,
      widgetName,
      ...widgetConfig,
    };

    yield put({
      type: WidgetReduxActionTypes.WIDGET_ADD_CHILD,
      payload: newWidget,
    });

    // Wait for widget names to be updated
    // Updating widget names here as widget blueprints don't take widget names
    yield take(ReduxActionTypes.SAVE_PAGE_SUCCESS);
    const widgets: { [widgetId: string]: FlattenedWidgetProps } =
      yield select(getWidgets);

    const nameInput = Object.values(widgets).find(
      (widget) => widget.widgetName === "Input1",
    );
    const emailInput = Object.values(widgets).find(
      (widget) => widget.widgetName === "Input2",
    );
    const countryInput = Object.values(widgets).find(
      (widget) => widget.widgetName === "Input3",
    );
    const imageWidget = Object.values(widgets).find(
      (widget) => widget.widgetName === "Image1",
    );

    if (nameInput && emailInput && countryInput && imageWidget) {
      yield put(
        updateWidgetName(nameInput.widgetId, GuidedTourEntityNames.NAME_INPUT),
      );
      yield take(ReduxActionTypes.FETCH_PAGE_DSL_SUCCESS);
      yield put(
        updateWidgetName(
          emailInput.widgetId,
          GuidedTourEntityNames.EMAIL_INPUT,
        ),
      );
      yield take(ReduxActionTypes.FETCH_PAGE_DSL_SUCCESS);
      yield put(
        updateWidgetName(
          countryInput.widgetId,
          GuidedTourEntityNames.COUNTRY_INPUT,
        ),
      );
      yield take(ReduxActionTypes.FETCH_PAGE_DSL_SUCCESS);
      yield put(
        updateWidgetName(
          imageWidget.widgetId,
          GuidedTourEntityNames.DISPLAY_IMAGE,
        ),
      );
    }
  } catch (error) {
    log.error(error);
  }
}

// Update button widget text
function* updateWidgetTextSaga() {
  const widgets: { [widgetId: string]: FlattenedWidgetProps } =
    yield select(getWidgets);
  const buttonWidget = Object.values(widgets).find(
    (widget) => widget.type === "BUTTON_WIDGET",
  );
  if (buttonWidget) {
    yield put(
      batchUpdateMultipleWidgetProperties([
        {
          widgetId: buttonWidget.widgetId,
          updates: {
            modify: {
              text: "Click to Update",
              rightColumn: buttonWidget.leftColumn + 24,
              bottomRow: buttonWidget.topRow + 5,
              widgetName: GuidedTourEntityNames.BUTTON_WIDGET,
            },
          },
        },
      ]),
    );
  }
}

function* focusWidgetPropertySaga(action: ReduxAction<string>) {
  const input: HTMLElement | null = document.querySelector(
    `[data-guided-tour-iid=${action.payload}] .CodeEditorTarget textarea`,
  );
  input?.focus();
}

function* endGuidedTourSaga(action: ReduxAction<boolean>) {
  if (!action.payload) {
    yield call(hideIndicator);
    yield call(sessionStorage.removeItem, GUIDED_TOUR_STORAGE_KEY);
  }
}

function* selectWidgetSaga(
  action: ReduxAction<{ widgetName: string; propertyName?: string }>,
) {
  const widgets: { [widgetId: string]: FlattenedWidgetProps } =
    yield select(getWidgets);
  const widget = Object.values(widgets).find((widget) => {
    return widget.widgetName === action.payload.widgetName;
  });

  if (widget) {
    yield put(
      selectWidgetInitAction(SelectionRequestType.One, [widget.widgetId]),
    );
    // Delay to wait for the fields to render
    yield delay(1000);
    // If the propertyName exist then we focus the respective input field as well
    if (action.payload.propertyName)
      yield put(focusWidgetProperty(action.payload.propertyName));
  }
}

// Signposting sagas
function* setFirstTimeUserOnboardingApplicationId(action: ReduxAction<string>) {
  yield storeFirstTimeUserOnboardingApplicationId(action.payload);

  const applicationIds: string[] =
    yield getFirstTimeUserOnboardingApplicationIds();
  yield put({
    type: ReduxActionTypes.SET_FIRST_TIME_USER_ONBOARDING_APPLICATION_IDS,
    payload: [...applicationIds, ...action.payload],
  });
}

function* removeFirstTimeUserOnboardingApplicationIdSaga(
  action: ReduxAction<string>,
) {
  yield call(removeFirstTimeUserOnboardingApplicationId, action.payload);

  const applicationIds: string[] =
    yield getFirstTimeUserOnboardingApplicationIds();
  yield put({
    type: ReduxActionTypes.SET_FIRST_TIME_USER_ONBOARDING_APPLICATION_IDS,
    payload: applicationIds.filter((id) => id !== action.payload),
  });
}

function* setFirstTimeUserOnboardingIntroModalVisibility(
  action: ReduxAction<boolean>,
) {
  yield storeFirstTimeUserOnboardingIntroModalVisibility(action.payload);
}

function* endFirstTimeUserOnboardingSaga() {
  const firstTimeUserExperienceAppId: string = yield select(
    getCurrentApplicationId,
  );
  yield put(
    removeFirstTimeUserOnboardingApplicationIdAction(
      firstTimeUserExperienceAppId,
    ),
  );
}

function* firstTimeUserOnboardingInitSaga(
  action: ReduxAction<{
    applicationId: string;
    pageId: string;
    suffix?: string;
  }>,
) {
  yield call(setEnableStartSignposting, true);
  yield put({
    type: ReduxActionTypes.SET_FIRST_TIME_USER_ONBOARDING_APPLICATION_ID,
    payload: action.payload.applicationId,
  });
  history.replace(
    builderURL({
      pageId: action.payload.pageId,
      suffix: action.payload.suffix || "",
    }),
  );

  const isEditorInitialised: boolean = yield select(getIsEditorInitialized);
  if (!isEditorInitialised) {
    yield take(ReduxActionTypes.INITIALIZE_EDITOR_SUCCESS);
  }

  let showOverlay = true;

  // We don't want to show the signposting overlay when we intend to show the
  // telemetry callout
  const currentUser: User | undefined = yield select(getCurrentUser);
  if (currentUser?.isSuperUser && !isAirgapped()) {
    const isAnonymousDataPopupAlreadyOpen: unknown = yield call(
      getFirstTimeUserOnboardingTelemetryCalloutIsAlreadyShown,
    );
    if (!isAnonymousDataPopupAlreadyOpen) {
      showOverlay = false;
    }
  }

  yield put(setSignpostingOverlay(showOverlay));
  // Show the modal once the editor is loaded. The delay is to grab user attention back once the editor
  yield delay(1000);
  yield put({
    type: ReduxActionTypes.SET_SHOW_FIRST_TIME_USER_ONBOARDING_MODAL,
    payload: true,
  });
  AnalyticsUtil.logEvent("SIGNPOSTING_MODAL_FIRST_TIME_OPEN");
}

function* setFirstTimeUserOnboardingCompleteSaga(action: ReduxAction<boolean>) {
  if (action.payload) {
    yield put(disableStartSignpostingAction());
  }
}

function* disableStartFirstTimeUserOnboardingSaga() {
  yield call(removeAllFirstTimeUserOnboardingApplicationIds);
  yield call(setEnableStartSignposting, false);
}

function* setSignpostingStepStateSaga(
  action: ReduxAction<{ step: SIGNPOSTING_STEP; completed: boolean }>,
) {
  const { completed, step } = action.payload;
  const stepState: StepState | undefined = yield select(
    getSignpostingStepStateByStep,
    step,
  );

  // No changes to update so we ignore
  if (stepState && stepState.completed === completed) return;

  const readProps = completed
    ? {
        read: false,
      }
    : {};
  yield put(
    signpostingStepUpdate({
      ...action.payload,
      ...readProps,
    }),
  );

  // Show tooltip when a step is completed
  if (!isUndefined(readProps.read) && !readProps.read) {
    // Show tooltip after a small delay to not be abrupt
    yield delay(1000);
    AnalyticsUtil.logEvent("SIGNPOSTING_STEP_COMPLETE", {
      step_name: SIGNPOSTING_ANALYTICS_STEP_NAME[step],
    });
    yield put(showSignpostingTooltip(true));
  }
}

export default function* onboardingActionSagas() {
  yield all([
    takeLatest(
      ReduxActionTypes.ONBOARDING_CREATE_APPLICATION,
      createApplication,
    ),
    takeLatest(ReduxActionTypes.SET_UP_TOUR_APP, setUpTourAppSaga),
    takeLatest(ReduxActionTypes.GUIDED_TOUR_ADD_WIDGET, addOnboardingWidget),
    takeLatest(ReduxActionTypes.SET_CURRENT_STEP_INIT, setCurrentStepSaga),
    takeLatest(
      ReduxActionTypes.UPDATE_BUTTON_WIDGET_TEXT,
      updateWidgetTextSaga,
    ),
    takeLatest(ReduxActionTypes.ENABLE_GUIDED_TOUR, endGuidedTourSaga),
    takeLatest(ReduxActionTypes.GUIDED_TOUR_FOCUS_WIDGET, selectWidgetSaga),
    takeLatest(ReduxActionTypes.FOCUS_WIDGET_PROPERTY, focusWidgetPropertySaga),
    takeLatest(ReduxActionTypes.LOAD_GUIDED_TOUR_INIT, loadGuidedTourInitSaga),
    takeLatest(
      ReduxActionTypes.SET_FIRST_TIME_USER_ONBOARDING_APPLICATION_ID,
      setFirstTimeUserOnboardingApplicationId,
    ),
    takeLatest(
      ReduxActionTypes.REMOVE_FIRST_TIME_USER_ONBOARDING_APPLICATION_ID,
      removeFirstTimeUserOnboardingApplicationIdSaga,
    ),
    takeLatest(
      ReduxActionTypes.SET_SHOW_FIRST_TIME_USER_ONBOARDING_MODAL,
      setFirstTimeUserOnboardingIntroModalVisibility,
    ),
    takeLatest(
      ReduxActionTypes.END_FIRST_TIME_USER_ONBOARDING,
      endFirstTimeUserOnboardingSaga,
    ),
    takeLatest(
      ReduxActionTypes.FIRST_TIME_USER_ONBOARDING_INIT,
      firstTimeUserOnboardingInitSaga,
    ),
    takeLatest(
      ReduxActionTypes.SET_FIRST_TIME_USER_ONBOARDING_COMPLETE,
      setFirstTimeUserOnboardingCompleteSaga,
    ),
    takeLatest(
      ReduxActionTypes.DISABLE_START_SIGNPOSTING,
      disableStartFirstTimeUserOnboardingSaga,
    ),
    takeLatest(
      ReduxActionTypes.SIGNPOSTING_STEP_UPDATE_INIT,
      setSignpostingStepStateSaga,
    ),
  ]);
}
