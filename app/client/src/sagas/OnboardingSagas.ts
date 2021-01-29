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
  put,
  select,
  take,
  takeEvery,
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
  getOnboardingWelcomeState,
  setOnboardingState,
  setOnboardingWelcomeState,
} from "utils/storage";
import { validateResponse } from "./ErrorSagas";
import { getSelectedWidget, getWidgets } from "./selectors";
import {
  setCurrentStep,
  setOnboardingState as setOnboardingReduxState,
  showIndicator,
} from "actions/onboardingActions";
import {
  changeDatasource,
  expandDatasourceEntity,
} from "actions/datasourceActions";
import { playOnboardingAnimation } from "utils/helpers";
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
  BUILDER_PAGE_URL,
  QUERY_EDITOR_URL_WITH_SELECTED_PAGE_ID,
} from "constants/routes";
import { QueryAction } from "entities/Action";
import history from "utils/history";
import { getQueryIdFromURL } from "pages/Editor/Explorer/helpers";
import { calculateNewWidgetPosition } from "./WidgetOperationSagas";
import { RenderModes, WidgetTypes } from "constants/WidgetConstants";
import { generateReactKey } from "utils/generators";
import { forceOpenPropertyPane } from "actions/widgetActions";
import { navigateToCanvas } from "pages/Editor/Explorer/Widgets/WidgetEntity";
import {
  updateWidgetProperty,
  updateWidgetPropertyRequest,
} from "../actions/controlActions";

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
      if (selectedWidget.tableData === initialTableData) {
        yield put(
          updateWidgetProperty(selectedWidget.widgetId, {
            tableData: [],
          }),
        );
      }

      AnalyticsUtil.logEvent("ONBOARDING_ADD_WIDGET");
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

      const helperConfig = yield select(
        (state) => state.ui.onBoarding.helperStepConfig,
      );
      const onSubmitGifUrl =
        "https://res.cloudinary.com/drako999/image/upload/v1611830618/Appsmith/Onboarding/onsubmit.gif";

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

      const updatedInputWidget = dataTree[inputWidget.widgetName];
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
          playOnboardingAnimation();

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

    yield take(ReduxActionTypes.SHOW_WELCOME);
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
  const onboardingWelcomeState = yield getOnboardingWelcomeState();

  if (currentOnboardingState && onboardingWelcomeState) {
    // AnalyticsUtil.logEvent("ONBOARDING_WELCOME");
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
}

function* skipOnboardingSaga() {
  const set = yield setOnboardingState(false);
  const resetWelcomeState = yield setOnboardingWelcomeState(false);

  if (set && resetWelcomeState) {
    yield put(setOnboardingReduxState(false));
  }
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
    "Untitled application ",
    applicationList.map((el: any) => el.name),
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
        body: "Select avatar, name, notes from standup_updates order by id",
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
    const columns = 8;
    const rows = 7;
    const widgets = yield select(getWidgets);

    let newWidget = {
      type: WidgetTypes.TABLE_WIDGET,
      newWidgetId: generateReactKey(),
      widgetId: "0",
      topRow: 0,
      bottomRow: 7,
      leftColumn: 0,
      rightColumn: columns,
      columns,
      rows,
      parentId: "0",
      renderMode: RenderModes.CANVAS,
      parentRowSpace: 40,
      parentColumnSpace: 1,
      isLoading: false,
      ...widgetConfig,
    };
    const {
      leftColumn,
      topRow,
      rightColumn,
      bottomRow,
    } = yield calculateNewWidgetPosition(newWidget, "0", widgets);

    newWidget = {
      ...newWidget,
      leftColumn,
      topRow,
      rightColumn,
      bottomRow,
    };

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

function* addTableWidget() {
  yield call(addWidget, {
    type: WidgetTypes.TABLE_WIDGET,
    props: {
      tableData: [],
      pageSize: 5,
    },
    widgetName: "Standup_Table",
  });
}

function* addInputWidget() {
  yield call(addWidget, {
    type: WidgetTypes.INPUT_WIDGET,
    widgetName: "Standup_Input",
    rows: 1,
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
  yield all([
    takeEvery("INITIATE_ONBOARDING", initiateOnboarding),
    takeEvery(
      ReduxActionTypes.CREATE_ONBOARDING_DBQUERY_INIT,
      createOnboardingDatasource,
    ),
    takeEvery(ReduxActionTypes.NEXT_ONBOARDING_STEP, proceedOnboardingSaga),
    takeEvery(ReduxActionTypes.LISTEN_FOR_CREATE_ACTION, listenForCreateAction),
    takeEvery(ReduxActionTypes.LISTEN_FOR_ADD_WIDGET, listenForWidgetAdditions),
    takeEvery("LISTEN_ADD_INPUT_WIDGET", listenForAddInputWidget),
    takeEvery(
      ReduxActionTypes.LISTEN_FOR_TABLE_WIDGET_BINDING,
      listenForSuccessfulBinding,
    ),
    takeEvery(ReduxActionTypes.SET_CURRENT_STEP, setupOnboardingStep),
    takeEvery(ReduxActionTypes.LISTEN_FOR_DEPLOY, listenForDeploySaga),
    // Cheat actions
    takeEvery("ONBOARDING_CREATE_APPLICATION", createApplication),
    takeEvery("ONBOARDING_CREATE_QUERY", createQuery),
    takeEvery("ONBOARDING_RUN_QUERY", executeQuery),
    takeEvery("ONBOARDING_ADD_TABLE_WIDGET", addTableWidget),
    takeEvery("ONBOARDING_ADD_INPUT_WIDGET", addInputWidget),
    takeEvery("ONBOARDING_ADD_ONSUBMIT_BINDING", addOnSubmitHandler),
    takeEvery("ONBOARDING_ADD_BINDING", addBinding),
    takeEvery("ONBOARDING_DEPLOY", deploy),
  ]);

  yield take(ReduxActionTypes.END_ONBOARDING);
  yield skipOnboardingSaga();
  yield cancel();
}
