import {
  ReduxAction,
  ReduxActionTypes,
  WidgetReduxActionTypes,
} from "@appsmith/constants/ReduxActionConstants";
import {
  all,
  put,
  select,
  takeLatest,
  delay,
  call,
  take,
} from "redux-saga/effects";
import {
  setEnableFirstTimeUserOnboarding as storeEnableFirstTimeUserOnboarding,
  setFirstTimeUserOnboardingApplicationId as storeFirstTimeUserOnboardingApplicationId,
  setFirstTimeUserOnboardingIntroModalVisibility as storeFirstTimeUserOnboardingIntroModalVisibility,
} from "utils/storage";

import { getCurrentUser } from "selectors/usersSelectors";
import history from "utils/history";
import TourApp from "pages/Editor/GuidedTour/app.json";

import {
  getFirstTimeUserOnboardingApplicationId,
  getHadReachedStep,
  getOnboardingWorkspaces,
  getQueryAction,
  getTableWidget,
} from "selectors/onboardingSelectors";
import { Toaster } from "components/ads/Toast";
import { Variant } from "components/ads/common";
import { Workspaces } from "constants/workspaceConstants";
import {
  enableGuidedTour,
  focusWidgetProperty,
  setCurrentStep,
  toggleLoader,
} from "actions/onboardingActions";
import {
  getCurrentApplicationId,
  getCurrentPageId,
  getIsEditorInitialized,
} from "selectors/editorSelectors";
import { WidgetProps } from "widgets/BaseWidget";
import { getNextWidgetName } from "./WidgetOperationUtils";
import WidgetFactory from "utils/WidgetFactory";
import { generateReactKey } from "utils/generators";
import { RenderModes } from "constants/WidgetConstants";
import log from "loglevel";
import { getDataTree } from "selectors/dataTreeSelectors";
import { getWidgets } from "./selectors";
import { clearActionResponse } from "actions/pluginActionActions";
import {
  importApplication,
  updateApplicationLayout,
} from "actions/applicationActions";
import { setPreviewModeAction } from "actions/editorActions";
import { FlattenedWidgetProps } from "widgets/constants";
import { ActionData } from "reducers/entityReducers/actionsReducer";
import { batchUpdateMultipleWidgetProperties } from "actions/controlActions";
import {
  setExplorerActiveAction,
  setExplorerPinnedAction,
} from "actions/explorerActions";
import { selectWidgetInitAction } from "actions/widgetSelectionActions";
import { hideIndicator } from "pages/Editor/GuidedTour/utils";
import { updateWidgetName } from "actions/propertyPaneActions";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { DataTree } from "entities/DataTree/dataTreeFactory";
import { CanvasWidgetsReduxState } from "reducers/entityReducers/canvasWidgetsReducer";
import { User } from "constants/userConstants";
import { builderURL, queryEditorIdURL } from "RouteBuilder";
import { GuidedTourEntityNames } from "pages/Editor/GuidedTour/constants";
import { navigateToCanvas } from "pages/Editor/Explorer/Widgets/utils";
import { shouldBeDefined } from "utils/helpers";

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

function* setCurrentStepSaga(action: ReduxAction<number>) {
  const hadReachedStep: number = yield select(getHadReachedStep);
  // Log only once when we reach that step
  if (action.payload > hadReachedStep) {
    AnalyticsUtil.logEvent("GUIDED_TOUR_REACHED_STEP", {
      step: action.payload,
    });
  }

  yield put(setCurrentStep(action.payload));
}

function* setUpTourAppSaga() {
  yield put(setPreviewModeAction(false));
  // Delete the container widget
  const widgets: { [widgetId: string]: FlattenedWidgetProps } = yield select(
    getWidgets,
  );
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
  const applicationId: string = yield select(getCurrentApplicationId);
  yield put(
    updateApplicationLayout(applicationId || "", {
      appLayout: {
        type: "DESKTOP",
      },
    }),
  );
  // Hide the explorer initialy
  yield put(setExplorerPinnedAction(false));
  yield put(setExplorerActiveAction(false));
  yield put(toggleLoader(false));
  if (!query) return;
  history.push(
    queryEditorIdURL({
      pageId: query.config.pageId,
      queryId: query.config.id,
    }),
  );
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
    const widgets: { [widgetId: string]: FlattenedWidgetProps } = yield select(
      getWidgets,
    );

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
  const widgets: { [widgetId: string]: FlattenedWidgetProps } = yield select(
    getWidgets,
  );
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
  }
}

function* selectWidgetSaga(
  action: ReduxAction<{ widgetName: string; propertyName?: string }>,
) {
  const widgets: { [widgetId: string]: FlattenedWidgetProps } = yield select(
    getWidgets,
  );
  const pageId = shouldBeDefined<string>(
    yield select(getCurrentPageId),
    "Page not found in state.entities.pageList.currentPageId",
  );
  const widget = Object.values(widgets).find((widget) => {
    return widget.widgetName === action.payload.widgetName;
  });

  if (widget) {
    // Navigate to the widget as well, usefull especially when we are not on the canvas
    navigateToCanvas({ pageId, widgetId: widget.widgetId });
    yield put(selectWidgetInitAction(widget.widgetId));
    // Delay to wait for the fields to render
    yield delay(1000);
    // If the propertyName exist then we focus the respective input field as well
    if (action.payload.propertyName)
      yield put(focusWidgetProperty(action.payload.propertyName));
  }
}

// Signposting sagas
function* setEnableFirstTimeUserOnboarding(action: ReduxAction<boolean>) {
  yield storeEnableFirstTimeUserOnboarding(action.payload);
}

function* setFirstTimeUserOnboardingApplicationId(action: ReduxAction<string>) {
  yield storeFirstTimeUserOnboardingApplicationId(action.payload);
}

function* setFirstTimeUserOnboardingIntroModalVisibility(
  action: ReduxAction<boolean>,
) {
  yield storeFirstTimeUserOnboardingIntroModalVisibility(action.payload);
}

function* endFirstTimeUserOnboardingSaga() {
  const firstTimeUserExperienceAppId: string = yield select(
    getFirstTimeUserOnboardingApplicationId,
  );
  yield put({
    type: ReduxActionTypes.SET_ENABLE_FIRST_TIME_USER_ONBOARDING,
    payload: false,
  });
  yield put({
    type: ReduxActionTypes.SET_FIRST_TIME_USER_ONBOARDING_APPLICATION_ID,
    payload: "",
  });
  Toaster.show({
    text: "Skipped First time user experience",
    hideProgressBar: false,
    variant: Variant.success,
    dispatchableAction: {
      type: ReduxActionTypes.UNDO_END_FIRST_TIME_USER_ONBOARDING,
      payload: firstTimeUserExperienceAppId,
    },
  });
}

function* undoEndFirstTimeUserOnboardingSaga(action: ReduxAction<string>) {
  yield put({
    type: ReduxActionTypes.SET_ENABLE_FIRST_TIME_USER_ONBOARDING,
    payload: true,
  });
  yield put({
    type: ReduxActionTypes.SET_FIRST_TIME_USER_ONBOARDING_APPLICATION_ID,
    payload: action.payload,
  });
}

function* firstTimeUserOnboardingInitSaga(
  action: ReduxAction<{ applicationId: string; pageId: string }>,
) {
  yield put({
    type: ReduxActionTypes.SET_ENABLE_FIRST_TIME_USER_ONBOARDING,
    payload: true,
  });
  yield put({
    type: ReduxActionTypes.SET_FIRST_TIME_USER_ONBOARDING_APPLICATION_ID,
    payload: action.payload.applicationId,
  });
  yield put({
    type: ReduxActionTypes.SET_SHOW_FIRST_TIME_USER_ONBOARDING_MODAL,
    payload: true,
  });
  history.replace(
    builderURL({
      pageId: action.payload.pageId,
    }),
  );
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
    takeLatest(
      ReduxActionTypes.SET_ENABLE_FIRST_TIME_USER_ONBOARDING,
      setEnableFirstTimeUserOnboarding,
    ),
    takeLatest(
      ReduxActionTypes.SET_FIRST_TIME_USER_ONBOARDING_APPLICATION_ID,
      setFirstTimeUserOnboardingApplicationId,
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
      ReduxActionTypes.UNDO_END_FIRST_TIME_USER_ONBOARDING,
      undoEndFirstTimeUserOnboardingSaga,
    ),
    takeLatest(
      ReduxActionTypes.FIRST_TIME_USER_ONBOARDING_INIT,
      firstTimeUserOnboardingInitSaga,
    ),
  ]);
}
