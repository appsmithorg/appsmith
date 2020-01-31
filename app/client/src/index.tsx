import React, { lazy, Suspense } from "react";
import { Helmet } from "react-helmet";
import ReactDOM from "react-dom";
import { Provider } from "react-redux";
import Loader from "pages/common/Loader";
import "./index.css";
import * as serviceWorker from "./serviceWorker";
import { Router, Route, Switch, Redirect } from "react-router-dom";
import history from "./utils/history";
import { ThemeProvider, theme } from "constants/DefaultTheme";
import { DndProvider } from "react-dnd";
import TouchBackend from "react-dnd-touch-backend";

import { appInitializer } from "utils/AppsmithUtils";
import ProtectedRoute from "./pages/common/ProtectedRoute";
import store from "./store";
import {
  BASE_URL,
  BUILDER_URL,
  APP_VIEW_URL,
  APPLICATIONS_URL,
  ORG_URL,
  USER_AUTH_URL,
  AUTH_LOGIN_URL,
  SIGN_UP_URL,
  BASE_LOGIN_URL,
  BASE_SIGNUP_URL,
  USERS_URL,
} from "constants/routes";

const loadingIndicator = <Loader />;
const App = lazy(() => import("./App"));
const UserAuth = lazy(() => import("./pages/UserAuth"));
const Editor = lazy(() => import("./pages/Editor"));
const Applications = lazy(() => import("./pages/Applications"));
const PageNotFound = lazy(() => import("./pages/common/PageNotFound"));
const AppViewer = lazy(() => import("./pages/AppViewer"));
const Organization = lazy(() => import("./pages/organization"));
const Users = lazy(() => import("./pages/users"));

appInitializer();

ReactDOM.render(
  <DndProvider
    backend={TouchBackend}
    options={{
      enableMouseEvents: true,
    }}
  >
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <Helmet>
          <meta charSet="utf-8" />
          <link rel="shortcut icon" href="/favicon-orange.ico" />
        </Helmet>
        <Router history={history}>
          <Suspense fallback={loadingIndicator}>
            <Switch>
              <ProtectedRoute exact path={BASE_URL} component={App} />
              <ProtectedRoute path={ORG_URL} component={Organization} />
              <ProtectedRoute exact path={USERS_URL} component={Users} />
              <Route path={USER_AUTH_URL} component={UserAuth} />
              <Redirect exact from={BASE_LOGIN_URL} to={AUTH_LOGIN_URL} />
              <Redirect exact from={BASE_SIGNUP_URL} to={SIGN_UP_URL} />
              <ProtectedRoute
                exact
                path={APPLICATIONS_URL}
                component={Applications}
              />
              <ProtectedRoute path={BUILDER_URL} component={Editor} />
              <ProtectedRoute path={APP_VIEW_URL} component={AppViewer} />
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
