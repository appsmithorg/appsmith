import React, { Suspense } from "react";
import history from "utils/history";
import AppHeader from "pages/common/AppHeader";
import { Redirect, Route, Router, Switch } from "react-router-dom";
import {
  APP_VIEW_URL,
  APPLICATIONS_URL,
  AUTH_LOGIN_URL,
  BASE_LOGIN_URL,
  BASE_SIGNUP_URL,
  BASE_URL,
  BUILDER_URL,
  getApplicationViewerPageURL,
  ORG_URL,
  PAGE_NOT_FOUND_URL,
  SERVER_ERROR_URL,
  SIGN_UP_URL,
  USER_AUTH_URL,
  USERS_URL,
} from "constants/routes";
import OrganizationLoader from "pages/organization/loader";
import ApplicationListLoader from "pages/Applications/loader";
import EditorLoader from "pages/Editor/loader";
import AppViewerLoader from "pages/AppViewer/loader";
import LandingScreen from "./LandingScreen";
import UserAuth from "pages/UserAuth";
import Users from "pages/users";
import PageNotFound from "pages/common/PageNotFound";
import PageLoadingBar from "pages/common/PageLoadingBar";
import ServerUnavailable from "pages/common/ServerUnavailable";
import { getThemeDetails } from "selectors/themeSelectors";
import { ThemeMode } from "reducers/uiReducers/themeReducer";
import { AppState } from "reducers";
import { setThemeMode } from "actions/themeActions";
import { connect } from "react-redux";

import * as Sentry from "@sentry/react";
import AnalyticsUtil from "utils/AnalyticsUtil";
const SentryRoute = Sentry.withSentryRouting(Route);

const loadingIndicator = <PageLoadingBar />;

function changeAppBackground(currentTheme: any) {
  if (
    window.location.pathname === "/applications" ||
    window.location.pathname.indexOf("/settings/") !== -1
  ) {
    document.body.style.backgroundColor =
      currentTheme.colors.homepageBackground;
  } else {
    document.body.style.backgroundColor = currentTheme.colors.appBackground;
  }
}

class AppRouter extends React.Component<any, any> {
  unlisten: any;

  componentDidMount() {
    // This is needed for the route switch.
    AnalyticsUtil.logEvent("ROUTE_CHANGE", { path: window.location.pathname });
    this.unlisten = history.listen((location: any) => {
      AnalyticsUtil.logEvent("ROUTE_CHANGE", { path: location.pathname });
      changeAppBackground(this.props.currentTheme);
    });
  }

  componentWillUnmount() {
    this.unlisten();
  }

  render() {
    const { currentTheme } = this.props;
    // This is needed for the theme switch.
    changeAppBackground(currentTheme);
    return (
      <Router history={history}>
        <Suspense fallback={loadingIndicator}>
          <AppHeader />
          <Switch>
            <SentryRoute exact path={BASE_URL} component={LandingScreen} />
            <Redirect exact from={BASE_LOGIN_URL} to={AUTH_LOGIN_URL} />
            <Redirect exact from={BASE_SIGNUP_URL} to={SIGN_UP_URL} />
            <SentryRoute path={ORG_URL} component={OrganizationLoader} />
            <SentryRoute exact path={USERS_URL} component={Users} />
            <SentryRoute path={USER_AUTH_URL} component={UserAuth} />
            <SentryRoute
              exact
              path={APPLICATIONS_URL}
              component={ApplicationListLoader}
            />
            <SentryRoute path={BUILDER_URL} component={EditorLoader} />
            <SentryRoute
              path={getApplicationViewerPageURL()}
              component={AppViewerLoader}
            />
            <SentryRoute path={APP_VIEW_URL} component={AppViewerLoader} />
            <SentryRoute
              exact
              path={PAGE_NOT_FOUND_URL}
              component={PageNotFound}
            />
            <SentryRoute
              exact
              path={SERVER_ERROR_URL}
              component={ServerUnavailable}
            />
            <SentryRoute component={PageNotFound} />
          </Switch>
        </Suspense>
      </Router>
    );
  }
}
const mapStateToProps = (state: AppState) => ({
  currentTheme: getThemeDetails(state).theme,
});
const mapDispatchToProps = (dispatch: any) => ({
  setTheme: (mode: ThemeMode) => {
    dispatch(setThemeMode(mode));
  },
});

export default connect(mapStateToProps, mapDispatchToProps)(AppRouter);
