import React, { lazy, Suspense } from "react";
import ReactDOM from "react-dom";
import { Provider } from "react-redux";
import Loader from "pages/common/Loader";
import "./index.css";
import * as serviceWorker from "./serviceWorker";
import { Router, Route, Switch } from "react-router-dom";
import { createStore, applyMiddleware } from "redux";
import history from "./utils/history";
import appReducer from "./reducers";
import { ThemeProvider, theme } from "./constants/DefaultTheme";
import createSagaMiddleware from "redux-saga";
import { rootSaga } from "./sagas";
import { DndProvider } from "react-dnd";
// import TouchBackend from "react-dnd-touch-backend";
import HTML5Backend from "react-dnd-html5-backend";
import { appInitializer } from "./utils/AppsmithUtils";
import ProtectedRoute from "./pages/common/ProtectedRoute";
import { composeWithDevTools } from "redux-devtools-extension/logOnlyInProduction";

import {
  BASE_URL,
  BUILDER_URL,
  APP_VIEW_URL,
  APPLICATIONS_URL,
  USER_AUTH_URL,
} from "./constants/routes";

const loadingIndicator = <Loader />;
const App = lazy(() => import("./App"));
const UserAuth = lazy(() => import("./pages/UserAuth"));
const Editor = lazy(() => import("./pages/Editor"));
const Applications = lazy(() => import("./pages/Applications"));
const PageNotFound = lazy(() => import("./pages/common/PageNotFound"));
const AppViewer = lazy(() => import("./pages/AppViewer"));

appInitializer();

const sagaMiddleware = createSagaMiddleware();
const store = createStore(
  appReducer,
  composeWithDevTools(applyMiddleware(sagaMiddleware)),
);
sagaMiddleware.run(rootSaga);

ReactDOM.render(
  <DndProvider backend={HTML5Backend}>
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <Router history={history}>
          <Suspense fallback={loadingIndicator}>
            <Switch>
              <Route exact path={BASE_URL} component={App} />
              <Route path={USER_AUTH_URL} component={UserAuth} />
              <ProtectedRoute path={BUILDER_URL} component={Editor} />
              <ProtectedRoute path={APP_VIEW_URL} component={AppViewer} />
              <ProtectedRoute
                exact
                path={APPLICATIONS_URL}
                component={Applications}
              />
              <Route component={PageNotFound} />
            </Switch>
          </Suspense>
        </Router>
      </ThemeProvider>
    </Provider>
  </DndProvider>,
  document.getElementById("root"),
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: http://bit.ly/CRA-PWA
serviceWorker.unregister();
