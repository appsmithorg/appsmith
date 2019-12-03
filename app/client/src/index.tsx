import React, { lazy, Suspense } from "react";
import ReactDOM from "react-dom";
import { Provider } from "react-redux";
import Loader from "pages/common/Loader";
import "normalize.css/normalize.css";
import "@blueprintjs/icons/lib/css/blueprint-icons.css";
import "@blueprintjs/core/lib/css/blueprint.css";
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
  LOGIN_URL,
  APP_VIEW_URL,
  APPLICATIONS_URL,
} from "./constants/routes";

const loadingIndicator = <Loader />;
const App = lazy(() => import("./App"));
const Editor = lazy(() => import("./pages/Editor"));
const Applications = lazy(() => import("./pages/Applications"));
const PageNotFound = lazy(() => import("./pages/common/PageNotFound"));
const LoginPage = lazy(() => import("./pages/common/LoginPage"));
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
              <ProtectedRoute path={BUILDER_URL} component={Editor} />
              <ProtectedRoute path={APP_VIEW_URL} component={AppViewer} />
              <ProtectedRoute
                exact
                path={APPLICATIONS_URL}
                component={Applications}
              />
              <Route exact path={LOGIN_URL} component={LoginPage} />
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
