import React, { Suspense } from "react";
import history from "utils/history";
import AppHeader from "pages/common/AppHeader";
import { Redirect, Route, Router, Switch } from "react-router-dom";
import {
  APPLICATIONS_URL,
  AUTH_LOGIN_URL,
  BASE_LOGIN_URL,
  BASE_SIGNUP_URL,
  BASE_URL,
  BUILDER_URL,
  ORG_URL,
  SIGN_UP_URL,
  SIGNUP_SUCCESS_URL,
  USER_AUTH_URL,
  USERS_URL,
  PROFILE,
  UNSUBSCRIBE_EMAIL_URL,
  SETUP,
  VIEWER_URL,
  ADMIN_SETTINGS_URL,
  ADMIN_SETTINGS_CATEGORY_URL,
  ADMIN_SETTINGS_CATEGORY_DEFAULT_URL,
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
import UnsubscribeEmail from "pages/common/UnsubscribeEmail";
import { getCurrentThemeDetails, ThemeMode } from "selectors/themeSelectors";
import { AppState } from "reducers";
import { setThemeMode } from "actions/themeActions";
import { connect } from "react-redux";

import * as Sentry from "@sentry/react";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { trimTrailingSlash } from "utils/helpers";
import { getSafeCrash, getSafeCrashCode } from "selectors/errorSelectors";
import UserProfile from "pages/UserProfile";
import { getCurrentUser } from "actions/authActions";
import { getFeatureFlagsFetched } from "selectors/usersSelectors";
import Setup from "pages/setup";
import Settings from "pages/Settings";
import SignupSuccess from "pages/setup/SignupSuccess";

const SentryRoute = Sentry.withSentryRouting(Route);

const loadingIndicator = <PageLoadingBar />;

function changeAppBackground(currentTheme: any) {
  if (
    trimTrailingSlash(window.location.pathname) === "/applications" ||
    window.location.pathname.indexOf("/settings/") !== -1 ||
    trimTrailingSlash(window.location.pathname) === "/profile" ||
    trimTrailingSlash(window.location.pathname) === "/signup-success"
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
    this.props.getCurrentUser();
  }

  componentWillUnmount() {
    this.unlisten();
  }

  render() {
    const {
      currentTheme,
      featureFlagsFetched,
      safeCrash,
      safeCrashCode,
    } = this.props;

    // This is needed for the theme switch.
    changeAppBackground(currentTheme);

    // Render the app once the feature flags have been fetched
    if (!featureFlagsFetched) return null;

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
                <SentryRoute component={LandingScreen} exact path={BASE_URL} />
                <Redirect exact from={BASE_LOGIN_URL} to={AUTH_LOGIN_URL} />
                <Redirect exact from={BASE_SIGNUP_URL} to={SIGN_UP_URL} />
                <SentryRoute component={OrganizationLoader} path={ORG_URL} />
                <SentryRoute component={Users} exact path={USERS_URL} />
                <SentryRoute component={UserAuth} path={USER_AUTH_URL} />
                <SentryRoute
                  component={ApplicationListLoader}
                  exact
                  path={APPLICATIONS_URL}
                />
                <SentryRoute
                  component={SignupSuccess}
                  exact
                  path={SIGNUP_SUCCESS_URL}
                />

                <SentryRoute component={UserProfile} path={PROFILE} />
                <SentryRoute
                  component={UnsubscribeEmail}
                  path={UNSUBSCRIBE_EMAIL_URL}
                />
                <SentryRoute component={Setup} exact path={SETUP} />
                <SentryRoute component={EditorLoader} path={BUILDER_URL} />
                <SentryRoute component={AppViewerLoader} path={VIEWER_URL} />
                <Redirect
                  exact
                  from={ADMIN_SETTINGS_URL}
                  to={ADMIN_SETTINGS_CATEGORY_DEFAULT_URL}
                />
                <SentryRoute
                  component={Settings}
                  exact
                  path={ADMIN_SETTINGS_CATEGORY_URL}
                />
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
  featureFlagsFetched: getFeatureFlagsFetched(state),
});

const mapDispatchToProps = (dispatch: any) => ({
  setTheme: (mode: ThemeMode) => {
    dispatch(setThemeMode(mode));
  },
  getCurrentUser: () => dispatch(getCurrentUser()),
});

export default connect(mapStateToProps, mapDispatchToProps)(AppRouter);
