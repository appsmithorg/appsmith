import { GenericApiResponse } from "api/ApiResponses";
import DatasourcesApi from "api/DatasourcesApi";
import { Datasource } from "entities/Datasource";
import { Plugin } from "api/PluginApi";
import {
  ReduxActionErrorTypes,
  ReduxActionTypes,
} from "constants/ReduxActionConstants";
import { AppState } from "reducers";
import {
  all,
  call,
  cancel,
  delay,
  fork,
  put,
  select,
  take,
  takeLatest,
} from "redux-saga/effects";
import {
  getCanvasWidgets,
  getDatasources,
  getPlugins,
} from "selectors/entitiesSelector";
import { getDataTree } from "selectors/dataTreeSelectors";
import { getCurrentOrgId } from "selectors/organizationSelectors";
import {
  getOnboardingState,
  setOnboardingState,
  setOnboardingWelcomeState,
} from "utils/storage";
import { validateResponse } from "./ErrorSagas";
import { getSelectedWidget, getWidgets } from "./selectors";
import {
  endOnboarding,
  setCurrentStep,
  setOnboardingState as setOnboardingReduxState,
  showIndicator,
} from "actions/onboardingActions";
import {
  changeDatasource,
  expandDatasourceEntity,
} from "actions/datasourceActions";
import { playOnboardingStepCompletionAnimation } from "utils/helpers";
import {
  OnboardingConfig,
  OnboardingStep,
} from "constants/OnboardingConstants";
import AnalyticsUtil from "../utils/AnalyticsUtil";
import { get } from "lodash";
import { AppIconCollection } from "components/ads/AppIcon";
import { getUserApplicationsOrgs } from "selectors/applicationSelectors";
import { getThemeDetails } from "selectors/themeSelectors";
import { getRandomPaletteColor, getNextEntityName } from "utils/AppsmithUtils";
import { getCurrentUser } from "selectors/usersSelectors";
import {
  getCurrentApplicationId,
  getCurrentPageId,
} from "selectors/editorSelectors";
import { createActionRequest, runActionInit } from "actions/actionActions";
import {
  APPLICATIONS_URL,
  BUILDER_PAGE_URL,
  QUERY_EDITOR_URL_WITH_SELECTED_PAGE_ID,
} from "constants/routes";
import { QueryAction } from "entities/Action";
import history from "utils/history";
import { getQueryIdFromURL } from "pages/Editor/Explorer/helpers";
// import { calculateNewWidgetPosition } from "./WidgetOperationSagas";
import { RenderModes, WidgetTypes } from "constants/WidgetConstants";
import { generateReactKey } from "utils/generators";
import { forceOpenPropertyPane } from "actions/widgetActions";
import { navigateToCanvas } from "pages/Editor/Explorer/Widgets/WidgetEntity";
import {
  updateWidgetProperty,
  updateWidgetPropertyRequest,
} from "../actions/controlActions";
import OnSubmitGif from "assets/gifs/onsubmit.gif";

export const getCurrentStep = (state: AppState) =>
  state.ui.onBoarding.currentStep;
export const inOnboarding = (state: AppState) =>
  state.ui.onBoarding.inOnboarding;
export const isAddWidgetComplete = (state: AppState) =>
  state.ui.onBoarding.addedWidget;
export const showCompletionDialog = (state: AppState) => {
  const isInOnboarding = inOnboarding(state);
  const currentStep = getCurrentStep(state);

  return isInOnboarding && currentStep === OnboardingStep.DEPLOY;
};
export const getInitialTableData = (state: AppState) => {
  const widgetConfig = state.entities.widgetConfig;

  return widgetConfig.config.TABLE_WIDGET.tableData;
};
export const getHelperConfig = (step: OnboardingStep) => {
  return OnboardingConfig[step].helper;
};

function* listenForWidgetAdditions() {
  while (true) {
    yield take();

    const selectedWidget = yield select(getSelectedWidget);
    const canvasWidgets = yield select(getCanvasWidgets);
    const initialTableData = yield select(getInitialTableData);

    // Updating the tableData property to []
    if (
      selectedWidget &&
      selectedWidget.type === "TABLE_WIDGET" &&
      canvasWidgets[selectedWidget.widgetId]
    ) {
      if (
        selectedWidget.widgetName === "Standup_Table" ||
        selectedWidget.tableData === initialTableData
      ) {
        yield put(
          updateWidgetProperty(selectedWidget.widgetId, {
            tableData: [],
            columnSizeMap: {
              avatar: 20,
              name: 30,
            },
            ...getStandupTableDimensions(),
          }),
        );
      }

      // AnalyticsUtil.logEvent("ONBOARDING_ADD_WIDGET");
      yield put(setCurrentStep(OnboardingStep.SUCCESSFUL_BINDING));
      yield put({
        type: ReduxActionTypes.ADD_WIDGET_COMPLETE,
      });
      yield put({
        type: ReduxActionTypes.SET_HELPER_CONFIG,
        payload: getHelperConfig(OnboardingStep.SUCCESSFUL_BINDING),
      });

      return;
    }
  }
}

function* listenForAddInputWidget() {
  while (true) {
    yield take();
    const canvasWidgets = yield select(getCanvasWidgets);
    const currentPageId = yield select(getCurrentPageId);
    const applicationId = yield select(getCurrentApplicationId);
    const widgets = yield select(getWidgets);

    const inputWidget: any = Object.values(widgets).find(
      (widget: any) => widget.type === "INPUT_WIDGET",
    );

    if (
      inputWidget &&
      inputWidget.type === "INPUT_WIDGET" &&
      canvasWidgets[inputWidget.widgetId]
    ) {
      if (
        !window.location.pathname.includes(
          BUILDER_PAGE_URL(applicationId, currentPageId),
        )
      ) {
        yield cancel();
      }

      if (inputWidget.widgetName !== "Standup_Input") {
        yield put(
          updateWidgetPropertyRequest(
            inputWidget.widgetId,
            "widgetName",
            "Standup_Input",
            RenderModes.CANVAS,
          ),
        );
        yield put(
          updateWidgetProperty(inputWidget.widgetId, {
            ...getStandupInputDimensions(),
            ...getStandupInputProps(),
          }),
        );
        yield put({
          type: "SET_CURRENT_SUBSTEP",
          payload: 2,
        });
      }

      const helperConfig = yield select(
        (state) => state.ui.onBoarding.helperStepConfig,
      );
      const onSubmitGifUrl = OnSubmitGif;

      if (helperConfig?.image.src !== onSubmitGifUrl) {
        yield put({
          type: ReduxActionTypes.SET_HELPER_CONFIG,
          payload: {
            ...helperConfig,
            image: {
              src: onSubmitGifUrl,
            },
          },
        });
      }

      yield take(ReduxActionTypes.CREATE_ACTION_SUCCESS);
      const dataTree = yield select(getDataTree);

      const updatedInputWidget = dataTree["Standup_Input"];
      const dynamicTriggerPathList = updatedInputWidget.dynamicTriggerPathList;
      const hasOnSubmitHandler =
        dynamicTriggerPathList &&
        dynamicTriggerPathList.length &&
        dynamicTriggerPathList.some(
          (trigger: any) => trigger.key === "onSubmit",
        );

      if (hasOnSubmitHandler) {
        yield put(
          updateWidgetPropertyRequest(
            inputWidget.widgetId,
            "onSubmit",
            "{{add_standup_updates.run(() => fetch_standup_updates.run(), () => {})}}",
            RenderModes.CANVAS,
          ),
        );

        yield put(setCurrentStep(OnboardingStep.DEPLOY));
        yield put({
          type: ReduxActionTypes.SET_HELPER_CONFIG,
          payload: getHelperConfig(OnboardingStep.DEPLOY),
        });

        return;
      }
    }
  }
}

function* listenForSuccessfulBinding() {
  while (true) {
    yield take();

    let bindSuccessful = true;
    const selectedWidget = yield select(getSelectedWidget);
    if (selectedWidget && selectedWidget.type === "TABLE_WIDGET") {
      const dataTree = yield select(getDataTree);

      if (dataTree[selectedWidget.widgetName]) {
        const widgetProperties = dataTree[selectedWidget.widgetName];
        const dynamicBindingPathList =
          dataTree[selectedWidget.widgetName].dynamicBindingPathList;
        const tableHasData = dataTree[selectedWidget.widgetName].tableData;
        const hasBinding =
          dynamicBindingPathList &&
          !!dynamicBindingPathList.length &&
          dynamicBindingPathList.some(
            (item: { key: string }) => item.key === "tableData",
          );

        bindSuccessful =
          bindSuccessful && hasBinding && tableHasData && tableHasData.length;

        if (widgetProperties.invalidProps) {
          bindSuccessful =
            bindSuccessful &&
            !(
              "tableData" in widgetProperties.invalidProps &&
              widgetProperties.invalidProps.tableData
            );
        }

        if (bindSuccessful) {
          yield put(
            updateWidgetProperty(selectedWidget.widgetId, {
              columnTypeMap: {
                avatar: {
                  type: "image",
                  format: "",
                },
              },
            }),
          );
          AnalyticsUtil.logEvent("ONBOARDING_SUCCESSFUL_BINDING");
          yield put(setCurrentStep(OnboardingStep.ADD_INPUT_WIDGET));

          yield delay(1000);

          yield put({
            type: ReduxActionTypes.SET_HELPER_CONFIG,
            payload: getHelperConfig(OnboardingStep.ADD_INPUT_WIDGET),
          });
          return;
        }
      }
    }
  }
}

function* createOnboardingDatasource() {
  AnalyticsUtil.logEvent("ONBOARDING_EXAMPLE_DATABASE");

  try {
    yield take([ReduxActionTypes.INITIALIZE_EDITOR_SUCCESS]);

    const organizationId = yield select(getCurrentOrgId);
    const plugins = yield select(getPlugins);
    const postgresPlugin = plugins.find(
      (plugin: Plugin) => plugin.name === "PostgreSQL",
    );
    const datasources: Datasource[] = yield select(getDatasources);
    let onboardingDatasource = datasources.find((datasource) => {
      const name = get(datasource, "name");

      return name === "Super Updates DB";
    });

    if (!onboardingDatasource) {
      const datasourceConfig: any = {
        pluginId: postgresPlugin.id,
        name: "Super Updates DB",
        organizationId,
        datasourceConfiguration: {
          connection: {
            mode: "READ_WRITE",
          },
          endpoints: [
            {
              host: "fake-api.cvuydmurdlas.us-east-1.rds.amazonaws.com",
              port: 5432,
            },
          ],
          authentication: {
            databaseName: "fakeapi",
            username: "fakeapi",
            password: "LimitedAccess123#",
          },
        },
      };

      const datasourceResponse: GenericApiResponse<Datasource> = yield DatasourcesApi.createDatasource(
        datasourceConfig,
      );
      yield validateResponse(datasourceResponse);
      yield put({
        type: ReduxActionTypes.CREATE_DATASOURCE_SUCCESS,
        payload: datasourceResponse.data,
      });

      onboardingDatasource = datasourceResponse.data;
    }

    yield put(expandDatasourceEntity(onboardingDatasource.id));

    yield put({
      type: ReduxActionTypes.CREATE_ONBOARDING_DBQUERY_SUCCESS,
    });

    // Navigate to that datasource page
    yield put(changeDatasource(onboardingDatasource));

    yield take(ReduxActionTypes.SHOW_ONBOARDING_LOADER);
    yield put({
      type: ReduxActionTypes.SET_HELPER_CONFIG,
      payload: getHelperConfig(OnboardingStep.EXAMPLE_DATABASE),
    });
    yield put({
      type: ReduxActionTypes.SHOW_ONBOARDING_HELPER,
      payload: true,
    });
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.CREATE_ONBOARDING_DBQUERY_ERROR,
      payload: { error },
    });
  }
}

function* listenForCreateAction() {
  const helperConfig = getHelperConfig(OnboardingStep.EXAMPLE_DATABASE);
  yield put(showIndicator(OnboardingStep.EXAMPLE_DATABASE));

  yield take([ReduxActionTypes.CREATE_ACTION_SUCCESS]);
  AnalyticsUtil.logEvent("ONBOARDING_ADD_QUERY");
  yield put({
    type: ReduxActionTypes.SET_HELPER_CONFIG,
    payload: {
      ...helperConfig,
      image: {
        src:
          "https://res.cloudinary.com/drako999/image/upload/v1611839705/Appsmith/Onboarding/run.gif",
      },
    },
  });
  yield put({
    type: "SET_CURRENT_SUBSTEP",
    payload: 2,
  });

  yield take([
    ReduxActionTypes.UPDATE_ACTION_INIT,
    ReduxActionTypes.QUERY_PANE_CHANGE,
    ReduxActionTypes.RUN_ACTION_INIT,
  ]);

  yield take([ReduxActionTypes.RUN_ACTION_SUCCESS]);
  AnalyticsUtil.logEvent("ONBOARDING_RUN_QUERY");
  yield put({
    type: ReduxActionTypes.SET_HELPER_CONFIG,
    payload: getHelperConfig(OnboardingStep.RUN_QUERY_SUCCESS),
  });
  yield put(showIndicator(OnboardingStep.RUN_QUERY_SUCCESS));

  yield put(setCurrentStep(OnboardingStep.RUN_QUERY_SUCCESS));
}

function* listenForDeploySaga() {
  while (true) {
    yield take();
    yield put(showIndicator(OnboardingStep.DEPLOY));

    yield take(ReduxActionTypes.PUBLISH_APPLICATION_SUCCESS);
    AnalyticsUtil.logEvent("ONBOARDING_DEPLOY");

    yield setOnboardingWelcomeState(false);
    yield put(setCurrentStep(OnboardingStep.FINISH));
    yield put({
      type: ReduxActionTypes.SHOW_ONBOARDING_COMPLETION_DIALOG,
      payload: true,
    });
    yield put(setOnboardingReduxState(false));

    return;
  }
}

function* initiateOnboarding() {
  const currentOnboardingState = yield getOnboardingState();

  if (currentOnboardingState) {
    yield put(setOnboardingReduxState(true));

    yield put(setCurrentStep(OnboardingStep.WELCOME));
    yield put(setCurrentStep(OnboardingStep.EXAMPLE_DATABASE));
  }
}

function* proceedOnboardingSaga() {
  const isInOnboarding = yield select(inOnboarding);

  if (isInOnboarding) {
    yield put({
      type: ReduxActionTypes.INCREMENT_STEP,
    });

    yield setupOnboardingStep();
  }
}

function* setupOnboardingStep() {
  const currentStep: OnboardingStep = yield select(getCurrentStep);
  const currentConfig = OnboardingConfig[currentStep];
  let actions = currentConfig.setup();

  if (actions.length) {
    actions = actions.map((action) => put(action));
    yield all(actions);
  }

  yield delay(500);
  playOnboardingStepCompletionAnimation();
}

function* skipOnboardingSaga() {
  const set = yield call(setOnboardingState, false);
  const resetWelcomeState = yield call(setOnboardingWelcomeState, false);

  if (set && resetWelcomeState) {
    yield put(setOnboardingReduxState(false));
  }
}

function* returnHomeSaga() {
  history.push(APPLICATIONS_URL);
  yield put(endOnboarding());
}

// Cheat actions
function* createApplication() {
  const themeDetails = yield select(getThemeDetails);
  const color = getRandomPaletteColor(themeDetails.theme.colors.appCardColors);
  const icon =
    AppIconCollection[Math.floor(Math.random() * AppIconCollection.length)];

  const currentUser = yield select(getCurrentUser);
  const userOrgs = yield select(getUserApplicationsOrgs);
  const currentOrganizationId = currentUser.currentOrganizationId;

  const organization = userOrgs.filter(
    (org: any) => org.organization.id === currentOrganizationId,
  );
  const applicationList = organization[0].applications;

  const applicationName = getNextEntityName(
    "Super Standup ",
    applicationList.map((el: any) => el.name),
    true,
  );

  yield put({
    type: ReduxActionTypes.CREATE_APPLICATION_INIT,
    payload: {
      applicationName,
      orgId: currentOrganizationId,
      icon,
      color,
    },
  });

  yield take(ReduxActionTypes.CREATE_APPLICATION_SUCCESS);
  yield put({
    type: "INITIATE_ONBOARDING",
  });
}

function* createQuery() {
  const currentPageId = yield select(getCurrentPageId);
  const applicationId = yield select(getCurrentApplicationId);
  const datasources: Datasource[] = yield select(getDatasources);
  const onboardingDatasource = datasources.find((datasource) => {
    const name = get(datasource, "name");

    return name === "Super Updates DB";
  });

  if (onboardingDatasource) {
    const payload = {
      name: "fetch_standup_updates",
      pageId: currentPageId,
      pluginId: onboardingDatasource?.pluginId,
      datasource: {
        id: onboardingDatasource?.id,
      },
      actionConfiguration: {
        body:
          "Select avatar, name, notes from standup_updates order by id desc",
      },
    } as Partial<QueryAction>;

    yield put(createActionRequest(payload));
    history.push(
      QUERY_EDITOR_URL_WITH_SELECTED_PAGE_ID(
        applicationId,
        currentPageId,
        currentPageId,
      ),
    );

    yield take(ReduxActionTypes.CREATE_ACTION_SUCCESS);
    yield put({
      type: "ONBOARDING_RUN_QUERY",
    });
  }
}

function* executeQuery() {
  const queryId = getQueryIdFromURL();

  if (queryId) {
    yield put(runActionInit(queryId));
  }
}

function* addWidget(widgetConfig: any) {
  try {
    // const widgets = yield select(getWidgets);

    const newWidget = {
      newWidgetId: generateReactKey(),
      widgetId: "0",
      parentId: "0",
      renderMode: RenderModes.CANVAS,
      isLoading: false,
      ...widgetConfig,
    };

    // bypassing this since we are hard coding positions during the oboarding flow
    // const {
    //   leftColumn,
    //   topRow,
    //   rightColumn,
    //   bottomRow,
    // } = yield calculateNewWidgetPosition(newWidget, "0", widgets);

    // console.log({ leftColumn, topRow, rightColumn, bottomRow });

    // newWidget = {
    //   ...newWidget,
    //   leftColumn,
    //   topRow,
    //   rightColumn,
    //   bottomRow,
    // };

    yield put({
      type: ReduxActionTypes.WIDGET_ADD_CHILD,
      payload: newWidget,
    });

    const applicationId = yield select(getCurrentApplicationId);
    const pageId = yield select(getCurrentPageId);

    navigateToCanvas(
      {
        applicationId,
        pageId,
      },
      window.location.pathname,
      pageId,
      newWidget.newWidgetId,
    );
    yield put({
      type: ReduxActionTypes.SELECT_WIDGET,
      payload: { widgetId: newWidget.newWidgetId },
    });
    yield put(forceOpenPropertyPane(newWidget.newWidgetId));
  } catch (error) {}
}

const getStandupTableDimensions = () => {
  const columns = 16;
  const rows = 15;
  const topRow = 2;
  const bottomRow = rows + topRow;
  return {
    parentRowSpace: 40,
    parentColumnSpace: 1,
    topRow: 2,
    bottomRow,
    leftColumn: 0,
    rightColumn: columns,
    columns: columns,
    rows: rows,
  };
};

const getStandupInputDimensions = () => {
  const columns = 6;
  const rows = 1;
  const leftColumn = 5;
  const rightColumn = leftColumn + columns;
  return {
    topRow: 1,
    bottomRow: 2,
    leftColumn,
    rightColumn,
    rows,
    columns,
  };
};

const getStandupInputProps = () => ({
  placeholderText: "Type your update and hit enter!",
});

function* addTableWidget() {
  yield call(addWidget, {
    type: WidgetTypes.TABLE_WIDGET,
    widgetName: "Standup_Table",
    ...getStandupTableDimensions(),
    props: {
      tableData: [],
    },
  });
}

function* addInputWidget() {
  yield call(addWidget, {
    type: WidgetTypes.INPUT_WIDGET,
    widgetName: "Standup_Input",
    ...getStandupInputDimensions(),
    props: getStandupInputProps(),
  });

  yield call(addOnSubmitHandler);
}

function* addOnSubmitHandler() {
  // Creating a query first
  const currentPageId = yield select(getCurrentPageId);
  const datasources: Datasource[] = yield select(getDatasources);
  const onboardingDatasource = datasources.find((datasource) => {
    const name = get(datasource, "name");

    return name === "Super Updates DB";
  });

  if (onboardingDatasource) {
    const payload = {
      name: "add_standup_updates",
      pageId: currentPageId,
      pluginId: onboardingDatasource?.pluginId,
      datasource: {
        id: onboardingDatasource?.id,
      },
      actionConfiguration: {
        body: `Insert into standup_updates("name", "notes") values ('{{appsmith.user.email}}', '{{ Standup_Input.text }}')`,
      },
    } as Partial<QueryAction>;

    yield put(createActionRequest(payload));

    yield take(ReduxActionTypes.CREATE_ACTION_SUCCESS);

    const widgets = yield select(getWidgets);
    const inputWidget: any = Object.values(widgets).find(
      (widget: any) => widget.type === "INPUT_WIDGET",
    );

    if (inputWidget) {
      yield delay(1000);

      const applicationId = yield select(getCurrentApplicationId);
      const pageId = yield select(getCurrentPageId);

      navigateToCanvas(
        {
          applicationId,
          pageId,
        },
        window.location.pathname,
        pageId,
        inputWidget.widgetId,
      );
      yield put({
        type: ReduxActionTypes.SELECT_WIDGET,
        payload: { widgetId: inputWidget.widgetId },
      });
      yield put(forceOpenPropertyPane(inputWidget.widgetId));

      yield put(
        updateWidgetPropertyRequest(
          inputWidget.widgetId,
          "onSubmit",
          "{{add_standup_updates.run(() => fetch_standup_updates.run(), () => {})}}",
          RenderModes.CANVAS,
        ),
      );

      yield put(setCurrentStep(OnboardingStep.DEPLOY));
      yield put({
        type: ReduxActionTypes.SET_HELPER_CONFIG,
        payload: getHelperConfig(OnboardingStep.DEPLOY),
      });
    }
  }
}

function* addBinding() {
  const selectedWidget = yield select(getSelectedWidget);

  if (selectedWidget && selectedWidget.type === "TABLE_WIDGET") {
    yield put(
      updateWidgetPropertyRequest(
        selectedWidget.widgetId,
        "tableData",
        "{{fetch_standup_updates.data}}",
        RenderModes.CANVAS,
      ),
    );
  }
}

function* deploy() {
  const applicationId = yield select(getCurrentApplicationId);
  yield put({
    type: ReduxActionTypes.PUBLISH_APPLICATION_INIT,
    payload: {
      applicationId,
    },
  });
}

export default function* onboardingSagas() {
  while (true) {
    const task = yield fork(onboardingActionSagas);

    yield take(ReduxActionTypes.END_ONBOARDING);
    yield cancel(task);
    yield call(skipOnboardingSaga);
  }
}

function* onboardingActionSagas() {
  yield all([
    takeLatest("INITIATE_ONBOARDING", initiateOnboarding),
    takeLatest(
      ReduxActionTypes.CREATE_ONBOARDING_DBQUERY_INIT,
      createOnboardingDatasource,
    ),
    takeLatest(ReduxActionTypes.NEXT_ONBOARDING_STEP, proceedOnboardingSaga),
    takeLatest(
      ReduxActionTypes.LISTEN_FOR_CREATE_ACTION,
      listenForCreateAction,
    ),
    takeLatest(
      ReduxActionTypes.LISTEN_FOR_ADD_WIDGET,
      listenForWidgetAdditions,
    ),
    takeLatest("LISTEN_ADD_INPUT_WIDGET", listenForAddInputWidget),
    takeLatest(
      ReduxActionTypes.LISTEN_FOR_TABLE_WIDGET_BINDING,
      listenForSuccessfulBinding,
    ),
    takeLatest(ReduxActionTypes.SET_CURRENT_STEP, setupOnboardingStep),
    takeLatest(ReduxActionTypes.LISTEN_FOR_DEPLOY, listenForDeploySaga),
    takeLatest("ONBOARDING_RETURN_HOME", returnHomeSaga),
    // Cheat actions
    takeLatest("ONBOARDING_CREATE_QUERY", createQuery),
    takeLatest("ONBOARDING_RUN_QUERY", executeQuery),
    takeLatest("ONBOARDING_ADD_TABLE_WIDGET", addTableWidget),
    takeLatest("ONBOARDING_ADD_INPUT_WIDGET", addInputWidget),
    takeLatest("ONBOARDING_ADD_ONSUBMIT_BINDING", addOnSubmitHandler),
    takeLatest("ONBOARDING_ADD_BINDING", addBinding),
    takeLatest("ONBOARDING_DEPLOY", deploy),
    takeLatest("ONBOARDING_CREATE_APPLICATION", createApplication),
  ]);
}
