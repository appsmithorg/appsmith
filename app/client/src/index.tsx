import React, { lazy, Suspense } from "react";
import { Helmet } from "react-helmet";
import ReactDOM from "react-dom";
import { Provider } from "react-redux";
import Loader from "pages/common/Loader";
import "./index.css";
import { Router, Switch, Redirect } from "react-router-dom";
import history from "./utils/history";
import { ThemeProvider, theme } from "constants/DefaultTheme";
import { appInitializer } from "utils/AppsmithUtils";
import AppRoute from "./pages/common/AppRoute";
import { Slide, ToastContainer } from "react-toastify";
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
  PAGE_NOT_FOUND_URL,
} from "constants/routes";
import { LayersContext, Layers } from "constants/Layers";
import EditorLoader from "pages/Editor/loader";
import ApplicationListLoader from "pages/Applications/loader";
import AppViewerLoader from "pages/AppViewer/loader";
import OrganizationLoader from "pages/organization/loader";

const loadingIndicator = <Loader />;
const App = lazy(() =>
  import(/* webpackChunkName: "appsmith",webpackPrefetch: 10 */ "./App"),
);
const UserAuth = lazy(() =>
  import(/* webpackChunkName: "auth",webpackPrefetch: 5 */ "./pages/UserAuth"),
);

const PageNotFound = lazy(() =>
  import(/* webpackChunkName: "404"*/ "./pages/common/PageNotFound"),
);
const Users = lazy(() => import(/* webpackPrefetch: true */ "./pages/users"));
appInitializer();

ReactDOM.render(
  <Provider store={store}>
    <LayersContext.Provider value={Layers}>
      <ThemeProvider theme={theme}>
        <ToastContainer
          hideProgressBar
          draggable={false}
          transition={Slide}
          autoClose={5000}
          closeButton={false}
        />
        <Helmet>
          <meta charSet="utf-8" />
          <link rel="shortcut icon" href="/favicon-orange.ico" />
        </Helmet>
        <Router history={history}>
          <Suspense fallback={loadingIndicator}>
            <Switch>
              <AppRoute
                exact
                path={BASE_URL}
                component={App}
                name={"App"}
                routeProtected
              />
              <AppRoute
                path={ORG_URL}
                component={OrganizationLoader}
                name={"Organisation"}
                routeProtected
              />
              <AppRoute
                exact
                path={USERS_URL}
                component={Users}
                name={"Users"}
                routeProtected
              />
              <AppRoute
                path={USER_AUTH_URL}
                component={UserAuth}
                name={"UserAuth"}
              />
              <Redirect exact from={BASE_LOGIN_URL} to={AUTH_LOGIN_URL} />
              <Redirect exact from={BASE_SIGNUP_URL} to={SIGN_UP_URL} />
              <AppRoute
                exact
                path={APPLICATIONS_URL}
                component={ApplicationListLoader}
                name={"Home"}
                routeProtected
              />
              <AppRoute
                path={BUILDER_URL}
                component={EditorLoader}
                name={"Editor"}
                routeProtected
              />
              <AppRoute
                path={APP_VIEW_URL}
                component={AppViewerLoader}
                name={"AppViewer"}
                routeProtected
                logDisable
              />
              <AppRoute
                path={PAGE_NOT_FOUND_URL}
                component={PageNotFound}
                name={"PageNotFound"}
              />
              <AppRoute component={PageNotFound} name={"PageNotFound"} />
            </Switch>
          </Suspense>
        </Router>
      </ThemeProvider>
    </LayersContext.Provider>
  </Provider>,
  document.getElementById("root"),
);
