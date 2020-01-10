import { createStore, applyMiddleware } from "redux";
import {
  useSelector as useReduxSelector,
  TypedUseSelectorHook,
} from "react-redux";
import appReducer, { AppState } from "./reducers";
import createSagaMiddleware from "redux-saga";
import { rootSaga } from "./sagas";
import { composeWithDevTools } from "redux-devtools-extension/logOnlyInProduction";

const sagaMiddleware = createSagaMiddleware();
export default createStore(
  appReducer,
  composeWithDevTools(applyMiddleware(sagaMiddleware)),
);
sagaMiddleware.run(rootSaga);

export const useSelector: TypedUseSelectorHook<AppState> = useReduxSelector;
