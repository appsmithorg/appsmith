import React, { lazy, Suspense } from "react";
import history from "utils/history";
import AppHeader from "pages/common/AppHeader";
import { Router, Switch } from "react-router-dom";
import AppRoute from "pages/common/AppRoute";
import {
  APP_VIEW_URL,
  APPLICATIONS_URL,
  BASE_URL,
  BUILDER_URL,
  ORG_URL,
  PAGE_NOT_FOUND_URL,
  USER_AUTH_URL,
  USERS_URL,
} from "constants/routes";
import OrganizationLoader from "pages/organization/loader";
import ApplicationListLoader from "pages/Applications/loader";
import EditorLoader from "pages/Editor/loader";
import AppViewerLoader from "pages/AppViewer/loader";
import LandingScreen from "./LandingScreen";
// import UserAuth from "pages/UserAuth";
import Users from "pages/users";
import PageNotFound from "pages/common/PageNotFound";
import Loader from "pages/common/Loader";

const loadingIndicator = <Loader />;
const UserAuth = lazy(() =>
  import(/* webpackChunkName: "auth",webpackPrefetch: 5 */ "./pages/UserAuth"),
);

class AppRouter extends React.Component<any, any> {
  render() {
    return (
      <Router history={history}>
        <Suspense fallback={loadingIndicator}>
          <AppHeader />
          <Switch>
            <AppRoute
              exact
              path={BASE_URL}
              component={LandingScreen}
              name={"App"}
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
              exact
              path={PAGE_NOT_FOUND_URL}
              component={PageNotFound}
              name={"PageNotFound"}
            />
            <AppRoute component={PageNotFound} name={"PageNotFound"} />
          </Switch>
        </Suspense>
      </Router>
    );
  }
}

export default AppRouter;
