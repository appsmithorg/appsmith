import { reduxBatch } from "@manaflair/redux-batch";
import { createStore, applyMiddleware } from "redux";
import {
  useSelector as useReduxSelector,
  TypedUseSelectorHook,
} from "react-redux";
import appReducer, { AppState } from "./reducers";
import createSagaMiddleware from "redux-saga";
import { rootSaga } from "sagas";
import { composeWithDevTools } from "redux-devtools-extension/logOnlyInProduction";
import * as Sentry from "@sentry/react";
import { ReduxActionTypes } from "constants/ReduxActionConstants";

// const logger = (method: string) => (...rest: any) => {
//   //console.error(`[SAGA MONITOR] ${method}`, ...rest);
// };

// const effects: any = {};

// const done = (effectId: any) => {
//   if (!effects[effectId]) return;
//   const { effect, startTime } = effects[effectId];

//   //console.error(effect.type, effect.payload, performance.now() - startTime);
// };
// const sagaMonitor = {
//   effectTriggered: ({ effectId, parentEffectId, label, effect }: any) => {
//     if (!effect) return;
//     const startTime = performance.now();
//     effects[effectId] = { effect, startTime };
//   },
//   effectResolved: done,
//   effectRejected: done,
//   effectCancelled: done,
// };
const sagaMiddleware = createSagaMiddleware();
const sentryReduxEnhancer = Sentry.createReduxEnhancer({
  actionTransformer: (action) => {
    if (
      action.type === ReduxActionTypes.SET_EVALUATED_TREE ||
      action.type === ReduxActionTypes.EXECUTE_API_ACTION_SUCCESS
    ) {
      // Return null to not log the action to Sentry
      action.payload = null;
    }
    return action;
  },
});

export default createStore(
  appReducer,
  composeWithDevTools(
    reduxBatch,
    applyMiddleware(sagaMiddleware),
    reduxBatch,
    sentryReduxEnhancer,
  ),
);
sagaMiddleware.run(rootSaga);

export const useSelector: TypedUseSelectorHook<AppState> = useReduxSelector;
