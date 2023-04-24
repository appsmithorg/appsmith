import { reduxBatch } from "@manaflair/redux-batch";
import { createStore, applyMiddleware, compose } from "redux";
import type { AppState } from "@appsmith/reducers";
import appReducer from "@appsmith/reducers";
import createSagaMiddleware from "redux-saga";
import { rootSaga } from "@appsmith/sagas";
import { composeWithDevTools } from "redux-devtools-extension/logOnlyInProduction";
import * as Sentry from "@sentry/react";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import routeParamsMiddleware from "RouteParamsMiddleware";
import { isAirgapped } from "@appsmith/utils/airgapHelpers";
import blockActionsMiddleware from "blockActionsMiddleware";

const isAirgappedInstance = isAirgapped();
const sagaMiddleware = createSagaMiddleware();
const ignoredSentryActionTypes = [
  ReduxActionTypes.SET_EVALUATED_TREE,
  ReduxActionTypes.EXECUTE_PLUGIN_ACTION_SUCCESS,
  ReduxActionTypes.SET_LINT_ERRORS,
];
const sentryReduxEnhancer = Sentry.createReduxEnhancer({
  actionTransformer: (action) => {
    if (ignoredSentryActionTypes.includes(action.type)) {
      // Return null to not log the action to Sentry
      action.payload = null;
    }
    return action;
  },
});

const middleWares = [sagaMiddleware, routeParamsMiddleware];

if (isAirgappedInstance) {
  middleWares.push(blockActionsMiddleware);
}

export default createStore(
  appReducer,
  composeWithDevTools(
    reduxBatch,
    applyMiddleware(...middleWares),
    reduxBatch,
    sentryReduxEnhancer,
  ),
);

export const testStore = (initialState: Partial<AppState>) =>
  createStore(
    appReducer,
    initialState,
    compose(reduxBatch, applyMiddleware(...middleWares), reduxBatch),
  );

// We don't want to run the saga middleware in tests, so exporting it from here
// And running it only when the app runs
export const runSagaMiddleware = () => sagaMiddleware.run(rootSaga);
