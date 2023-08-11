import React, { Suspense } from "react";
import history from "utils/history";
import AppHeader from "pages/common/AppHeader";
import { Redirect, Route, Router, Switch } from "react-router-dom";
import {
  ADMIN_SETTINGS_CATEGORY_PATH,
  ADMIN_SETTINGS_PATH,
  APPLICATIONS_URL,
  AUTH_LOGIN_URL,
  BASE_LOGIN_URL,
  BASE_SIGNUP_URL,
  BASE_URL,
  BUILDER_CUSTOM_PATH,
  BUILDER_PATCH_PATH,
  BUILDER_PATH,
  BUILDER_PATH_DEPRECATED,
  PROFILE,
  SETUP,
  SIGNUP_SUCCESS_URL,
  SIGN_UP_URL,
  TEMPLATES_PATH,
  USERS_URL,
  USER_AUTH_URL,
  VIEWER_CUSTOM_PATH,
  VIEWER_PATCH_PATH,
  VIEWER_PATH,
  VIEWER_PATH_DEPRECATED,
  WORKSPACE_URL,
} from "constants/routes";
import WorkspaceLoader from "pages/workspace/loader";
import ApplicationListLoader from "pages/Applications/loader";
import EditorLoader from "pages/Editor/loader";
import AppViewerLoader from "pages/AppViewer/loader";
import LandingScreen from "../LandingScreen";
import UserAuth from "pages/UserAuth";
import Users from "pages/users";
import ErrorPage from "pages/common/ErrorPage";
import PageNotFound from "pages/common/ErrorPages/PageNotFound";
import PageLoadingBar from "pages/common/PageLoadingBar";
import ErrorPageHeader from "pages/common/ErrorPageHeader";
import { useSelector } from "react-redux";

import * as Sentry from "@sentry/react";
import { getSafeCrash, getSafeCrashCode } from "selectors/errorSelectors";
import UserProfile from "pages/UserProfile";
import Setup from "pages/setup";
import SettingsLoader from "pages/Settings/loader";
import SignupSuccess from "pages/setup/SignupSuccess";
import type { ERROR_CODES } from "@appsmith/constants/ApiConstants";
import TemplatesListLoader from "pages/Templates/loader";
import { getDefaultAdminSettingsPath } from "@appsmith/utils/adminSettingsHelpers";
import { getCurrentUser as getCurrentUserSelector } from "selectors/usersSelectors";
import { getTenantPermissions } from "@appsmith/selectors/tenantSelectors";
import RouteChangeListener from "RouteChangeListener";
import Walkthrough from "components/featureWalkthrough";
import ProductAlertBanner from "components/editorComponents/ProductAlertBanner";
import { useFirstRouteLoad } from "../pages/loaderHooks";

export const SentryRoute = Sentry.withSentryRouting(Route);

export const loadingIndicator = <PageLoadingBar />;

export function Routes() {
  const user = useSelector(getCurrentUserSelector);
  const tenantPermissions = useSelector(getTenantPermissions);
  return (
    <Switch>
      <SentryRoute component={LandingScreen} exact path={BASE_URL} />
      <Redirect exact from={BASE_LOGIN_URL} to={AUTH_LOGIN_URL} />
      <Redirect exact from={BASE_SIGNUP_URL} to={SIGN_UP_URL} />
      <SentryRoute component={WorkspaceLoader} path={WORKSPACE_URL} />
      <SentryRoute component={Users} exact path={USERS_URL} />
      <SentryRoute component={UserAuth} path={USER_AUTH_URL} />
      <SentryRoute
        component={ApplicationListLoader}
        exact
        path={APPLICATIONS_URL}
      />
      <SentryRoute component={SignupSuccess} exact path={SIGNUP_SUCCESS_URL} />
      <SentryRoute component={UserProfile} path={PROFILE} />
      <SentryRoute component={Setup} exact path={SETUP} />
      <SentryRoute component={TemplatesListLoader} path={TEMPLATES_PATH} />
      <Redirect
        exact
        from={ADMIN_SETTINGS_PATH}
        to={
          !user
            ? ADMIN_SETTINGS_PATH
            : getDefaultAdminSettingsPath({
                isSuperUser: user?.isSuperUser || false,
                tenantPermissions,
              })
        }
      />
      <SentryRoute
        component={SettingsLoader}
        exact
        path={ADMIN_SETTINGS_CATEGORY_PATH}
      />
      <SentryRoute component={EditorLoader} path={BUILDER_PATH_DEPRECATED} />
      <SentryRoute component={AppViewerLoader} path={VIEWER_PATH_DEPRECATED} />
      {/*
       * Note: When making changes to the order of these paths
       * Be sure to check if it is sync with the order of checks in getUpdatedRoute helper method
       * Context: https://github.com/appsmithorg/appsmith/pull/19833
       */}
      <SentryRoute component={EditorLoader} path={BUILDER_PATH} />
      <SentryRoute component={EditorLoader} path={BUILDER_CUSTOM_PATH} />
      <SentryRoute component={AppViewerLoader} path={VIEWER_PATH} />
      <SentryRoute component={AppViewerLoader} path={VIEWER_CUSTOM_PATH} />
      {/*
       * End Note: When making changes to the order of the paths above
       */}
      <Redirect from={BUILDER_PATCH_PATH} to={BUILDER_PATH} />
      <Redirect from={VIEWER_PATCH_PATH} to={VIEWER_PATH} />
      <SentryRoute component={PageNotFound} />
    </Switch>
  );
}

function AppRouter() {
  useFirstRouteLoad();
  const isSafeCrash = useSelector(getSafeCrash);
  const safeCrashCode: ERROR_CODES | undefined = useSelector(getSafeCrashCode);
  return (
    <Router history={history}>
      <Suspense fallback={loadingIndicator}>
        <RouteChangeListener />
        {isSafeCrash && safeCrashCode ? (
          <>
            <ErrorPageHeader />
            <ErrorPage code={safeCrashCode} />
          </>
        ) : (
          <>
            <Walkthrough>
              <AppHeader />
              <Routes />
            </Walkthrough>
            <ProductAlertBanner />
          </>
        )}
      </Suspense>
    </Router>
  );
}

export default AppRouter;
