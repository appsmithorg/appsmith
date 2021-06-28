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
  setCurrentSubstep,
  setHelperConfig,
  setOnboardingState as setOnboardingReduxState,
  showIndicator,
  showOnboardingHelper,
} from "actions/onboardingActions";
import {
  changeDatasource,
  expandDatasourceEntity,
} from "actions/datasourceActions";
import {
  playOnboardingAnimation,
  playOnboardingStepCompletionAnimation,
} from "utils/helpers";
import {
  OnboardingConfig,
  OnboardingHelperConfig,
  OnboardingStep,
} from "constants/OnboardingConstants";
import AnalyticsUtil from "../utils/AnalyticsUtil";
import { get } from "lodash";
import { AppIconCollection } from "components/ads/AppIcon";
import { getUserApplicationsOrgs } from "selectors/applicationSelectors";
import { getAppCardColorPalette } from "selectors/themeSelectors";
import {
  getRandomPaletteColor,
  getNextEntityName,
  getQueryParams,
} from "utils/AppsmithUtils";
import { getCurrentUser } from "selectors/usersSelectors";
import {
  getCurrentApplicationId,
  getCurrentPageId,
  getIsEditorInitialized,
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
import { navigateToCanvas } from "pages/Editor/Explorer/Widgets/utils";
import {
  batchUpdateWidgetProperty,
  updateWidgetPropertyRequest,
} from "actions/controlActions";
import OnSubmitGif from "assets/gifs/onsubmit.gif";
import { checkAndGetPluginFormConfigsSaga } from "sagas/PluginSagas";
import { GRID_DENSITY_MIGRATION_V1 } from "mockResponses/WidgetConfigResponse";
import {
  EVAL_ERROR_PATH,
  EvaluationError,
  PropertyEvaluationErrorType,
} from "utils/DynamicBindingUtils";

export const getCurrentStep = (state: AppState) =>
  state.ui.onBoarding.currentStep;
export const getCurrentSubStep = (state: AppState) =>
  state.ui.onBoarding.currentSubstep;
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
  return OnboardingConfig[step].helper as OnboardingHelperConfig;
};
export const checkCurrentStep = (
  state: AppState,
  step: OnboardingStep,
  comparison: "EQAULS" | "LESSER" = "EQAULS",
) => {
  const isInOnboarding = inOnboarding(state);
  const currentStep = getCurrentStep(state);

  switch (comparison) {
    case "LESSER":
      return isInOnboarding && currentStep < step;
    default:
      return isInOnboarding && currentStep === step;
  }
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
          batchUpdateWidgetProperty(selectedWidget.widgetId, {
            modify: {
              widgetName: "Standup_Table",
              tableData: [],
              columnSizeMap: {
                avatar: 20,
                name: 30,
              },
              migrated: false,
              ...getStandupTableDimensions(),
            },
          }),
        );
      }

      AnalyticsUtil.logEvent("ONBOARDING_ADD_WIDGET_TABLE");
      yield put(setCurrentStep(OnboardingStep.SUCCESSFUL_BINDING));
      yield put({
        type: ReduxActionTypes.ADD_WIDGET_COMPLETE,
      });
      yield put(
        setHelperConfig(getHelperConfig(OnboardingStep.SUCCESSFUL_BINDING)),
      );

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

      AnalyticsUtil.logEvent("ONBOARDING_ADD_WIDGET_INPUT");

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
          batchUpdateWidgetProperty(inputWidget.widgetId, {
            modify: {
              ...getStandupInputDimensions(),
              ...getStandupInputProps(),
            },
          }),
        );
        yield put(setCurrentSubstep(2));

        yield put(showIndicator(OnboardingStep.ADD_INPUT_WIDGET));
      }

      const helperConfig: OnboardingHelperConfig = yield select(
        (state) => state.ui.onBoarding.helperStepConfig,
      );
      const onSubmitGifUrl = OnSubmitGif;

      if (helperConfig.image?.src !== onSubmitGifUrl) {
        yield put(
          setHelperConfig({
            ...helperConfig,
            image: {
              src: onSubmitGifUrl,
            },
          }),
        );
      }

      yield take(ReduxActionTypes.CREATE_ACTION_SUCCESS);
      const dataTree = yield select(getDataTree);

      const updatedInputWidget = dataTree["Standup_Input"];

      if (updatedInputWidget) {
        const dynamicTriggerPathList =
          updatedInputWidget.dynamicTriggerPathList;
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
          AnalyticsUtil.logEvent("ONBOARDING_ONSUBMIT_SUCCESS");

          yield put(setCurrentStep(OnboardingStep.DEPLOY));
          yield put(setHelperConfig(getHelperConfig(OnboardingStep.DEPLOY)));

          return;
        }
      }
    }
  }
}

function* listenForSuccessfulBinding() {
  while (true) {
    yield take();

    let bindSuccessful = true;
    const selectedWidget = yield call(getStandupTableWidget);
    if (selectedWidget && selectedWidget.type === "TABLE_WIDGET") {
      const dataTree = yield select(getDataTree);

      if (dataTree[selectedWidget.widgetName]) {
        const dynamicBindingPathList =
          dataTree[selectedWidget.widgetName].dynamicBindingPathList;
        const tableHasData = dataTree[selectedWidget.widgetName].tableData;
        const hasBinding =
          dynamicBindingPathList &&
          !!dynamicBindingPathList.length &&
          dynamicBindingPathList.some(
            (item: { key: string }) => item.key === "tableData",
          );
        const errors = get(
          selectedWidget,
          `${EVAL_ERROR_PATH}.tableData`,
          [],
        ).filter(
          (error: EvaluationError) =>
            error.errorType !== PropertyEvaluationErrorType.LINT,
        );

        bindSuccessful =
          bindSuccessful &&
          hasBinding &&
          Array.isArray(tableHasData) &&
          tableHasData.length &&
          errors.length === 0;

        if (bindSuccessful) {
          yield put(
            batchUpdateWidgetProperty(selectedWidget.widgetId, {
              modify: {
                columnTypeMap: {
                  avatar: {
                    type: "image",
                    format: "",
                  },
                },
              },
            }),
          );
          AnalyticsUtil.logEvent("ONBOARDING_SUCCESSFUL_BINDING");
          yield put(setCurrentStep(OnboardingStep.ADD_INPUT_WIDGET));

          yield delay(1000);

          yield put(
            setHelperConfig(getHelperConfig(OnboardingStep.ADD_INPUT_WIDGET)),
          );
          return;
        }
      }
    }
  }
}

function* createOnboardingDatasource() {
  AnalyticsUtil.logEvent("ONBOARDING_INTRODUCTION");

  try {
    const isEditorInitialized = yield select(getIsEditorInitialized);
    if (!isEditorInitialized)
      yield take(ReduxActionTypes.INITIALIZE_EDITOR_SUCCESS);

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
            ssl: { authType: "DEFAULT" },
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
          sshProxyEnabled: false,
        },
      };

      const datasourceResponse: GenericApiResponse<Datasource> = yield DatasourcesApi.createDatasource(
        datasourceConfig,
      );
      yield validateResponse(datasourceResponse);
      yield checkAndGetPluginFormConfigsSaga(postgresPlugin.id);
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
    yield put(
      setHelperConfig(getHelperConfig(OnboardingStep.EXAMPLE_DATABASE)),
    );
    yield put(showOnboardingHelper(true));
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
  yield put(
    setHelperConfig({
      ...helperConfig,
      image: {
        src:
          "https://res.cloudinary.com/drako999/image/upload/v1611839705/Appsmith/Onboarding/run.gif",
      },
    }),
  );
  yield put(setCurrentSubstep(2));

  yield take([
    ReduxActionTypes.UPDATE_ACTION_INIT,
    ReduxActionTypes.QUERY_PANE_CHANGE,
    ReduxActionTypes.RUN_ACTION_INIT,
  ]);

  yield take([ReduxActionTypes.RUN_ACTION_SUCCESS]);
  AnalyticsUtil.logEvent("ONBOARDING_RUN_QUERY");
  yield put(setHelperConfig(getHelperConfig(OnboardingStep.RUN_QUERY_SUCCESS)));
  yield put(showIndicator(OnboardingStep.RUN_QUERY_SUCCESS));

  yield put(setCurrentStep(OnboardingStep.RUN_QUERY_SUCCESS));
}

function* listenForDeploySaga() {
  while (true) {
    yield take();
    yield put(showIndicator(OnboardingStep.DEPLOY));

    yield take(ReduxActionTypes.PUBLISH_APPLICATION_SUCCESS);
    AnalyticsUtil.logEvent("ONBOARDING_DEPLOY");

    yield call(setOnboardingWelcomeState, false);
    yield put(setCurrentStep(OnboardingStep.FINISH));
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

  AnalyticsUtil.logEvent("ONBOARDING_GO_HOME");
}

function* showEndOnboardingHelperSaga() {
  const params = getQueryParams();
  const inOnboarding = yield call(getOnboardingState);

  if (params.onboardingComplete && inOnboarding) {
    yield put(
      setHelperConfig(
        getHelperConfig(OnboardingStep.FINISH) as OnboardingHelperConfig,
      ),
    );
    AnalyticsUtil.logEvent("ONBOARDING_COMPLETE");
    yield put(setCurrentSubstep(5));

    yield delay(1000);
    yield call(playOnboardingAnimation);
    yield put(showOnboardingHelper(true));
  }
}

// Cheat actions
function* createApplication() {
  const colorPalette = yield select(getAppCardColorPalette);
  const color = getRandomPaletteColor(colorPalette);
  const icon =
    AppIconCollection[Math.floor(Math.random() * AppIconCollection.length)];

  const currentUser = yield select(getCurrentUser);
  const userOrgs = yield select(getUserApplicationsOrgs);
  const currentOrganizationId = currentUser.currentOrganizationId;
  let organization;

  if (!currentOrganizationId) {
    organization = userOrgs[0];
  } else {
    const filteredOrganizations = userOrgs.filter(
      (org: any) => org.organization.id === currentOrganizationId,
    );
    organization = filteredOrganizations[0];
  }

  // Organization could be undefined for unknown reason
  if (organization) {
    const applicationList = organization.applications;

    const applicationName = getNextEntityName(
      "Super Standup ",
      applicationList.map((el: any) => el.name),
      true,
    );

    yield put({
      type: ReduxActionTypes.CREATE_APPLICATION_INIT,
      payload: {
        applicationName,
        orgId: organization.organization.id,
        icon,
        color,
      },
    });

    yield take(ReduxActionTypes.CREATE_APPLICATION_SUCCESS);
    yield call(initiateOnboarding);
  }
}

function* createQuery() {
  const currentPageId = yield select(getCurrentPageId);
  const applicationId = yield select(getCurrentApplicationId);
  const currentSubstep = yield select(getCurrentSubStep);
  const datasources: Datasource[] = yield select(getDatasources);
  const onboardingDatasource = datasources.find((datasource) => {
    const name = get(datasource, "name");

    return name === "Super Updates DB";
  });

  // If the user is on substep 2 of the CREATE_QUERY step
  // just run the query.
  if (currentSubstep == 2) {
    yield put({
      type: "ONBOARDING_RUN_QUERY",
    });

    AnalyticsUtil.logEvent("ONBOARDING_CHEAT", {
      step: 1,
    });

    return;
  }

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
        timeoutInMillisecond: 30000,
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

    AnalyticsUtil.logEvent("ONBOARDING_CHEAT", {
      step: 1,
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
    const newWidget = {
      newWidgetId: generateReactKey(),
      widgetId: "0",
      parentId: "0",
      renderMode: RenderModes.CANVAS,
      isLoading: false,
      ...widgetConfig,
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
      type: ReduxActionTypes.SELECT_WIDGET_INIT,
      payload: { widgetId: newWidget.newWidgetId },
    });
    yield put(forceOpenPropertyPane(newWidget.newWidgetId));
  } catch (error) {}
}

const getStandupTableDimensions = () => {
  const columns = 16 * GRID_DENSITY_MIGRATION_V1;
  const rows = 15 * GRID_DENSITY_MIGRATION_V1;
  const topRow = 2 * GRID_DENSITY_MIGRATION_V1;
  const bottomRow = rows + topRow;
  return {
    parentRowSpace: 40,
    parentColumnSpace: 1,
    topRow,
    bottomRow,
    leftColumn: 0,
    rightColumn: columns,
    columns: columns,
    rows: rows,
  };
};

const getStandupInputDimensions = () => {
  const columns = 6 * GRID_DENSITY_MIGRATION_V1;
  const rows = 1 * GRID_DENSITY_MIGRATION_V1;
  const leftColumn = 5 * GRID_DENSITY_MIGRATION_V1;
  const rightColumn = leftColumn + columns;
  return {
    topRow: 1 * GRID_DENSITY_MIGRATION_V1,
    bottomRow: 2 * GRID_DENSITY_MIGRATION_V1,
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

  AnalyticsUtil.logEvent("ONBOARDING_ADD_WIDGET_CLICK");
  AnalyticsUtil.logEvent("ONBOARDING_CHEAT", {
    step: 2,
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
        type: ReduxActionTypes.SELECT_WIDGET_INIT,
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
      AnalyticsUtil.logEvent("ONBOARDING_ONSUBMIT_SUCCESS");

      yield put(setCurrentStep(OnboardingStep.DEPLOY));
      yield put(setHelperConfig(getHelperConfig(OnboardingStep.DEPLOY)));

      AnalyticsUtil.logEvent("ONBOARDING_CHEAT", {
        step: 4,
      });
    }
  }
}

function* getStandupTableWidget() {
  const canvasWidgets: Record<string, any> = yield select(getCanvasWidgets);
  const result =
    Object.entries(canvasWidgets).find((widgetEntry) => {
      const [, widget] = widgetEntry;
      return widget.widgetName === "Standup_Table";
    }) || [];
  const standupTable = result[1];
  return standupTable;
}

function* addBinding() {
  const standupTable = yield call(getStandupTableWidget);
  if (standupTable) {
    yield put(
      updateWidgetPropertyRequest(
        standupTable.widgetId,
        "tableData",
        "{{fetch_standup_updates.data}}",
        RenderModes.CANVAS,
      ),
    );

    AnalyticsUtil.logEvent("ONBOARDING_CHEAT", {
      step: 3,
    });
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

  AnalyticsUtil.logEvent("ONBOARDING_CHEAT", {
    step: 5,
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
    takeLatest(
      ReduxActionTypes.LISTEN_ADD_INPUT_WIDGET,
      listenForAddInputWidget,
    ),
    takeLatest(
      ReduxActionTypes.LISTEN_FOR_TABLE_WIDGET_BINDING,
      listenForSuccessfulBinding,
    ),
    takeLatest(ReduxActionTypes.SET_CURRENT_STEP, setupOnboardingStep),
    takeLatest(ReduxActionTypes.LISTEN_FOR_DEPLOY, listenForDeploySaga),
    takeLatest(ReduxActionTypes.ONBOARDING_RETURN_HOME, returnHomeSaga),
    takeLatest(
      ReduxActionTypes.SHOW_END_ONBOARDING_HELPER,
      showEndOnboardingHelperSaga,
    ),
    // Cheat actions
    takeLatest(ReduxActionTypes.ONBOARDING_CREATE_QUERY, createQuery),
    takeLatest(ReduxActionTypes.ONBOARDING_RUN_QUERY, executeQuery),
    takeLatest(ReduxActionTypes.ONBOARDING_ADD_TABLE_WIDGET, addTableWidget),
    takeLatest(ReduxActionTypes.ONBOARDING_ADD_INPUT_WIDGET, addInputWidget),
    takeLatest(
      ReduxActionTypes.ONBOARDING_ADD_ONSUBMIT_BINDING,
      addOnSubmitHandler,
    ),
    takeLatest(ReduxActionTypes.ONBOARDING_ADD_TABLEDATA_BINDING, addBinding),
    takeLatest(ReduxActionTypes.ONBOARDING_DEPLOY, deploy),
    takeLatest(
      ReduxActionTypes.ONBOARDING_CREATE_APPLICATION,
      createApplication,
    ),
  ]);
}
