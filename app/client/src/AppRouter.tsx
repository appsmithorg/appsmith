import React, { Suspense, useEffect } from "react";
import history from "utils/history";
import AppHeader from "pages/common/AppHeader";
import { Redirect, Route, Router, Switch } from "react-router-dom";
import {
  APPLICATIONS_URL,
  AUTH_LOGIN_URL,
  BASE_LOGIN_URL,
  BASE_SIGNUP_URL,
  BASE_URL,
  BUILDER_PATH,
  BUILDER_CUSTOM_PATH,
  WORKSPACE_URL,
  SIGN_UP_URL,
  SIGNUP_SUCCESS_URL,
  USER_AUTH_URL,
  USERS_URL,
  PROFILE,
  SETUP,
  VIEWER_PATH,
  VIEWER_CUSTOM_PATH,
  ADMIN_SETTINGS_PATH,
  ADMIN_SETTINGS_CATEGORY_PATH,
  ADMIN_SETTINGS_CATEGORY_DEFAULT_PATH,
  BUILDER_PATH_DEPRECATED,
  VIEWER_PATH_DEPRECATED,
  TEMPLATES_PATH,
  VIEWER_PATCH_PATH,
  BUILDER_PATCH_PATH,
} from "constants/routes";
import WorkspaceLoader from "pages/workspace/loader";
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
import { getCurrentUser } from "actions/authActions";
import { selectFeatureFlags } from "selectors/usersSelectors";
import Setup from "pages/setup";
import Settings from "@appsmith/pages/AdminSettings";
import SignupSuccess from "pages/setup/SignupSuccess";
import { Theme } from "constants/DefaultTheme";
import { ERROR_CODES } from "@appsmith/constants/ApiConstants";
import TemplatesListLoader from "pages/Templates/loader";
import { fetchFeatureFlagsInit } from "actions/userActions";
import FeatureFlags from "entities/FeatureFlags";
import WDSPage from "components/wds/Showcase";

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

function AppRouter(props: {
  safeCrash: boolean;
  getCurrentUser: () => void;
  getFeatureFlags: () => void;
  currentTheme: Theme;
  safeCrashCode?: ERROR_CODES;
  featureFlags: FeatureFlags;
  setTheme: (theme: ThemeMode) => void;
}) {
  const { getCurrentUser, getFeatureFlags } = props;
  useEffect(() => {
    AnalyticsUtil.logEvent("ROUTE_CHANGE", { path: window.location.pathname });
    const stopListener = history.listen((location: any) => {
      AnalyticsUtil.logEvent("ROUTE_CHANGE", { path: location.pathname });
      changeAppBackground(props.currentTheme);
    });
    getCurrentUser();
    getFeatureFlags();
    return stopListener;
  }, []);

  useEffect(() => {
    changeAppBackground(props.currentTheme);
  }, [props.currentTheme]);

  return (
    <Router history={history}>
      <Suspense fallback={loadingIndicator}>
        {props.safeCrash && props.safeCrashCode ? (
          <>
            <ErrorPageHeader />
            <ErrorPage code={props.safeCrashCode} />
          </>
        ) : (
          <>
            <AppHeader />
            <Switch>
              <SentryRoute component={LandingScreen} exact path={BASE_URL} />
              <Redirect exact from={BASE_LOGIN_URL} to={AUTH_LOGIN_URL} />
              <Redirect exact from={BASE_SIGNUP_URL} to={SIGN_UP_URL} />
              <SentryRoute component={WorkspaceLoader} path={WORKSPACE_URL} />
              <SentryRoute component={Users} exact path={USERS_URL} />
              <SentryRoute component={UserAuth} path={USER_AUTH_URL} />
              <SentryRoute component={WDSPage} path="/wds" />
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
              <SentryRoute component={Setup} exact path={SETUP} />

              <SentryRoute
                component={TemplatesListLoader}
                path={TEMPLATES_PATH}
              />
              <Redirect
                exact
                from={ADMIN_SETTINGS_PATH}
                to={ADMIN_SETTINGS_CATEGORY_DEFAULT_PATH}
              />
              <SentryRoute
                component={Settings}
                exact
                path={ADMIN_SETTINGS_CATEGORY_PATH}
              />
              <SentryRoute
                component={EditorLoader}
                path={BUILDER_PATH_DEPRECATED}
              />
              <SentryRoute
                component={AppViewerLoader}
                path={VIEWER_PATH_DEPRECATED}
              />
              <SentryRoute component={EditorLoader} path={BUILDER_PATH} />
              <SentryRoute
                component={EditorLoader}
                path={BUILDER_CUSTOM_PATH}
              />
              <SentryRoute component={AppViewerLoader} path={VIEWER_PATH} />
              <SentryRoute
                component={AppViewerLoader}
                path={VIEWER_CUSTOM_PATH}
              />
              <Redirect from={BUILDER_PATCH_PATH} to={BUILDER_PATH} />
              <Redirect from={VIEWER_PATCH_PATH} to={VIEWER_PATH} />
              <SentryRoute component={PageNotFound} />
            </Switch>
          </>
        )}
      </Suspense>
    </Router>
  );
}

const mapStateToProps = (state: AppState) => ({
  currentTheme: getCurrentThemeDetails(state),
  safeCrash: getSafeCrash(state),
  safeCrashCode: getSafeCrashCode(state),
  featureFlags: selectFeatureFlags(state),
});

const mapDispatchToProps = (dispatch: any) => ({
  setTheme: (mode: ThemeMode) => {
    dispatch(setThemeMode(mode));
  },
  getCurrentUser: () => dispatch(getCurrentUser()),
  getFeatureFlags: () => dispatch(fetchFeatureFlagsInit()),
});

export default connect(mapStateToProps, mapDispatchToProps)(AppRouter);
