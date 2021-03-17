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
  SIGN_UP_URL,
  USER_AUTH_URL,
  USERS_URL,
  PROFILE,
} from "constants/routes";
import OrganizationLoader from "pages/organization/loader";
import ApplicationListLoader from "pages/Applications/loader";
import EditorLoader from "pages/Editor/loader";
import AppViewerLoader from "pages/AppViewer/loader";
import LandingScreen from "./LandingScreen";
import UserAuth from "pages/UserAuth";
import Users from "pages/users";
import ErrorPage from "pages/common/ErrorPage";
import PageNotFound from "pages/common/PageNotFound";
import PageLoadingBar from "pages/common/PageLoadingBar";
import ErrorPageHeader from "pages/common/ErrorPageHeader";
import { getCurrentThemeDetails, ThemeMode } from "selectors/themeSelectors";
import { AppState } from "reducers";
import { setThemeMode } from "actions/themeActions";
import { connect } from "react-redux";

import * as Sentry from "@sentry/react";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { trimTrailingSlash } from "utils/helpers";
import { getSafeCrash, getSafeCrashCode } from "selectors/errorSelectors";
import UserProfile from "pages/UserProfile";

const SentryRoute = Sentry.withSentryRouting(Route);

const loadingIndicator = <PageLoadingBar />;

function changeAppBackground(currentTheme: any) {
  if (
    trimTrailingSlash(window.location.pathname) === "/applications" ||
    window.location.pathname.indexOf("/settings/") !== -1 ||
    trimTrailingSlash(window.location.pathname) === "/profile"
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
    const { currentTheme, safeCrash, safeCrashCode } = this.props;

    // This is needed for the theme switch.
    changeAppBackground(currentTheme);

    return (
      <Router history={history}>
        <Suspense fallback={loadingIndicator}>
          {safeCrash ? (
            <>
              <ErrorPageHeader />
              <ErrorPage code={safeCrashCode} />
            </>
          ) : (
            <>
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
                <SentryRoute exact path={PROFILE} component={UserProfile} />
                <SentryRoute path={APP_VIEW_URL} component={AppViewerLoader} />
                <SentryRoute component={PageNotFound} />
              </Switch>
            </>
          )}
        </Suspense>
      </Router>
    );
  }
}
const mapStateToProps = (state: AppState) => ({
  currentTheme: getCurrentThemeDetails(state),
  safeCrash: getSafeCrash(state),
  safeCrashCode: getSafeCrashCode(state),
});

const mapDispatchToProps = (dispatch: any) => ({
  setTheme: (mode: ThemeMode) => {
    dispatch(setThemeMode(mode));
  },
});

export default connect(mapStateToProps, mapDispatchToProps)(AppRouter);
