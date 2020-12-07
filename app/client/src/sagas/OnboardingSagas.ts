import { isNull } from "lodash";
import { GenericApiResponse } from "api/ApiResponses";
import DatasourcesApi, { Datasource } from "api/DatasourcesApi";
import { Plugin } from "api/PluginApi";
import {
  ReduxActionErrorTypes,
  ReduxActionTypes,
} from "constants/ReduxActionConstants";
import { AppState } from "reducers";
import { all, select, put, takeEvery, take, delay } from "redux-saga/effects";
import { getCurrentPageId } from "selectors/editorSelectors";
import { getDatasources, getPlugins } from "selectors/entitiesSelector";
import { getDataTree } from "selectors/dataTreeSelectors";
import { getCurrentOrgId } from "selectors/organizationSelectors";
import { getOnboardingState, setOnboardingState } from "utils/storage";
import { validateResponse } from "./ErrorSagas";
import { getSelectedWidget } from "./selectors";
import ActionAPI, { ActionCreateUpdateResponse } from "api/ActionAPI";
import {
  createOnboardingActionInit,
  createOnboardingActionSuccess,
  showTooltip,
} from "actions/onboardingActions";
import { changeDatasource } from "actions/datasourceActions";
import { playOnboardingAnimation } from "utils/helpers";
import { QueryAction } from "entities/Action";

export const getCurrentStep = (state: AppState) =>
  state.ui.onBoarding.currentStep;
export const inOnboarding = (state: AppState) =>
  state.ui.onBoarding.inOnboarding;
export const isAddWidgetComplete = (state: AppState) =>
  state.ui.onBoarding.addedWidget;
export const getTooltipConfig = (
  state: AppState,
): { isFinalStep?: boolean } => {
  const currentStep = getCurrentStep(state);
  if (currentStep >= 0) {
    return OnboardingConfig[currentStep].tooltip;
  }

  return {};
};

const OnboardingConfig = [
  {
    step: 0,
    name: "Welcome",
    setup: () => {
      // To setup the state if any
      // Return action that needs to be dispatched
      return [
        {
          type: "SHOW_WELCOME",
        },
      ];
    },
    tooltip: {
      title: "",
      description: "",
    },
  },
  {
    step: 1,
    name: "Example Database",
    setup: () => {
      return [
        {
          type: "CREATE_ONBOARDING_DBQUERY_INIT",
        },
        {
          type: "LISTEN_FOR_ADD_WIDGET",
        },
        {
          type: "LISTEN_FOR_TABLE_WIDGET_BINDING",
        },
      ];
    },
    tooltip: {
      title: "Say hello to your example database",
      description:
        "Go ahead, check it out. You can add the “+” icon to create a new query or connect to your own db.",
      action: {
        label: "Got It!",
      },
    },
  },
  {
    step: 2,
    name: "Add widget",
    setup: () => {
      return [];
    },
    tooltip: {
      title:
        "Wohoo! Your first widget. 🎉 Go ahead and connect this to a Query or API",
      description:
        "Copy the example binding below and paste inside TableData input",
      snippet: "{{ExampleQuery.data}}",
    },
  },
  {
    step: 3,
    name: "Successful binding",
    setup: () => {
      return [
        {
          type: "LISTEN_FOR_WIDGET_UNSELECTION",
        },
      ];
    },
    tooltip: {
      title: "This table is now connected to Example Query",
      description:
        "You can connect properties to variables on Appsmith with {{ }} bindings",
      action: {
        label: "Next",
        action: {
          type: "SET_CURRENT_STEP",
          payload: 4,
        },
      },
    },
  },
  {
    step: 4,
    name: "Deploy",
    setup: () => {
      return [
        {
          type: "LISTEN_FOR_DEPLOY",
        },
      ];
    },
    tooltip: {
      title: "You’re almost done! Just Hit Deploy",
      description:
        "Deploying your apps is a crucial step to building on appsmith.",
      isFinalStep: true,
    },
  },
];

function* listenForWidgetAdditions() {
  while (true) {
    yield take();
    const { payload } = yield take("WIDGET_ADD_CHILD");

    if (payload.type === "TABLE_WIDGET") {
      yield put({
        type: "SET_CURRENT_STEP",
        payload: 2,
      });
      yield put({
        type: "ADD_WIDGET_COMPLETE",
      });
      yield put(showTooltip(2));

      return;
    }
  }
}

function* listenForSuccessfullBinding() {
  while (true) {
    yield take();
    let bindSuccessfull = true;
    const selectedWidget = yield select(getSelectedWidget);
    if (selectedWidget && selectedWidget.type === "TABLE_WIDGET") {
      const dataTree = yield select(getDataTree);

      if (dataTree[selectedWidget.widgetName]) {
        const widgetProperties = dataTree[selectedWidget.widgetName];
        const dynamicBindingPathList =
          dataTree[selectedWidget.widgetName].dynamicBindingPathList;
        const hasBinding = !!dynamicBindingPathList.length;

        if (hasBinding) {
          yield put(showTooltip(-1));
        }

        bindSuccessfull = bindSuccessfull && hasBinding;

        if (widgetProperties.invalidProps) {
          bindSuccessfull =
            bindSuccessfull && !("tableData" in widgetProperties.invalidProps);
        }

        if (bindSuccessfull) {
          yield put({
            type: "SET_CURRENT_STEP",
            payload: 3,
          });

          // Show tooltip now
          yield put(showTooltip(3));
          yield delay(1000);
          playOnboardingAnimation();

          return;
        }
      }
    }
  }
}

function* createOnboardingDatasource() {
  try {
    const organizationId = yield select(getCurrentOrgId);
    const plugins = yield select(getPlugins);
    const postgresPlugin = plugins.find(
      (plugin: Plugin) => plugin.name === "PostgreSQL",
    );
    const datasources: Datasource[] = yield select(getDatasources);
    let onboardingDatasource = datasources.find(
      datasource => datasource.name === "ExampleDatabase",
    );

    if (!onboardingDatasource) {
      const datasourceConfig = {
        pluginId: postgresPlugin.id,
        name: "ExampleDatabase",
        organizationId,
        datasourceConfiguration: {
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

    const currentPageId = yield select(getCurrentPageId);
    const queryactionConfiguration: Partial<QueryAction> = {
      actionConfiguration: { body: "select * from public.users limit 10" },
    };
    const actionPayload = {
      name: "ExampleQuery",
      pageId: currentPageId,
      datasource: {
        id: onboardingDatasource.id,
      },
      ...queryactionConfiguration,
      eventData: {},
    };
    yield put(createOnboardingActionInit(actionPayload));
    const response: ActionCreateUpdateResponse = yield ActionAPI.createAPI(
      actionPayload,
    );

    const isValidResponse = yield validateResponse(response);
    if (isValidResponse) {
      const newAction = {
        ...response.data,
        datasource: onboardingDatasource,
      };
      yield put(createOnboardingActionSuccess(newAction));
      yield put({
        type: ReduxActionTypes.CREATE_ONBOARDING_DBQUERY_SUCCESS,
      });

      yield put(changeDatasource(onboardingDatasource));

      yield put(showTooltip(1));
    } else {
      yield put({
        type: ReduxActionErrorTypes.CREATE_ONBOARDING_ACTION_ERROR,
        payload: actionPayload,
      });
    }
  } catch (error) {
    yield put({
      type: "CREATE_ONBOARDING_DBQUERY_ERROR",
      payload: { error },
    });
  }
}

function* listenForWidgetUnselection() {
  while (true) {
    yield take();

    yield take(ReduxActionTypes.HIDE_PROPERTY_PANE);
    const currentStep = yield select(getCurrentStep);
    const isinOnboarding = yield select(inOnboarding);

    if (!isinOnboarding || currentStep !== 3) return;

    yield put({
      type: "SET_CURRENT_STEP",
      payload: 4,
    });

    yield delay(1000);
    yield put(showTooltip(4));
    return;
  }
}

function* listenForDeploySaga() {
  while (true) {
    yield take();

    yield take(ReduxActionTypes.PUBLISH_APPLICATION_INIT);
    yield put(showTooltip(-1));
    yield put({
      type: ReduxActionTypes.SHOW_ONBOARDING_COMPLETION_DIALOG,
      payload: true,
    });

    return;
  }
}

function* initiateOnboarding() {
  const currentOnboardingState = yield getOnboardingState();
  if (currentOnboardingState) {
    yield put({
      type: "SET_ONBOARDING_STATE",
      payload: true,
    });
    yield put({
      type: "NEXT_ONBOARDING_STEP",
    });
  }
}

function* proceedOnboardingSaga() {
  const isinOnboarding = yield select(inOnboarding);

  if (isinOnboarding) {
    yield put({
      type: "INCREMENT_STEP",
    });

    yield setupOnboardingStep();
  }
}

function* setupOnboardingStep() {
  const currentStep = yield select(getCurrentStep);
  const currentConfig = OnboardingConfig[currentStep];
  let actions = currentConfig.setup();

  if (actions.length) {
    actions = actions.map(action => put(action));
    yield all(actions);
  }
}

function* skipOnboardingSaga() {
  const set = yield setOnboardingState(false);

  if (set) {
    yield put({
      type: "SET_ONBOARDING_STATE",
      payload: false,
    });
  }
}

export default function* onboardingSagas() {
  yield all([
    takeEvery(ReduxActionTypes.CREATE_APPLICATION_SUCCESS, initiateOnboarding),
    takeEvery("CREATE_ONBOARDING_DBQUERY_INIT", createOnboardingDatasource),
    takeEvery("NEXT_ONBOARDING_STEP", proceedOnboardingSaga),
    takeEvery("END_ONBOARDING", skipOnboardingSaga),
    takeEvery("LISTEN_FOR_ADD_WIDGET", listenForWidgetAdditions),
    takeEvery("LISTEN_FOR_TABLE_WIDGET_BINDING", listenForSuccessfullBinding),
    takeEvery("LISTEN_FOR_WIDGET_UNSELECTION", listenForWidgetUnselection),
    takeEvery("SET_CURRENT_STEP", setupOnboardingStep),
    takeEvery("LISTEN_FOR_DEPLOY", listenForDeploySaga),
  ]);
}
