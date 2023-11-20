import React, { Suspense, useEffect } from "react";
import history from "utils/history";
import AppHeader from "@appsmith/pages/common/AppHeader";
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
  CUSTOM_WIDGETS_EDITOR_ID_PATH,
  CUSTOM_WIDGETS_EDITOR_ID_PATH_CUSTOM,
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
  WIDGET_BUILDER,
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
import type { AppState } from "@appsmith/reducers";
import { connect, useSelector } from "react-redux";

import * as Sentry from "@sentry/react";
import { getSafeCrash, getSafeCrashCode } from "selectors/errorSelectors";
import UserProfile from "pages/UserProfile";
import { getCurrentUser } from "actions/authActions";
import {
  getCurrentUserLoading,
  getFeatureFlagsFetching,
} from "selectors/usersSelectors";
import Setup from "pages/setup";
import SettingsLoader from "pages/AdminSettings/loader";
import SignupSuccess from "pages/setup/SignupSuccess";
import type { ERROR_CODES } from "@appsmith/constants/ApiConstants";
import TemplatesListLoader from "pages/Templates/loader";
import {
  fetchFeatureFlagsInit,
  fetchProductAlertInit,
} from "actions/userActions";
import { getCurrentTenant } from "@appsmith/actions/tenantActions";
import { getCurrentUser as getCurrentUserSelector } from "selectors/usersSelectors";
import {
  getTenantPermissions,
  isTenantLoading,
} from "@appsmith/selectors/tenantSelectors";
import useBrandingTheme from "utils/hooks/useBrandingTheme";
import RouteChangeListener from "RouteChangeListener";
import { initCurrentPage } from "../actions/initActions";
import Walkthrough from "components/featureWalkthrough";
import ProductAlertBanner from "components/editorComponents/ProductAlertBanner";
import WidgetBuilder from "pages/WidgetBuilder";
import { getAdminSettingsPath } from "@appsmith/utils/BusinessFeatures/adminSettingsHelpers";
import { useFeatureFlag } from "utils/hooks/useFeatureFlag";
import { FEATURE_FLAG } from "@appsmith/entities/FeatureFlag";
import CustomWidgetBuilder from "pages/Editor/CustomWidgetBuilder";

export const SentryRoute = Sentry.withSentryRouting(Route);

export const loadingIndicator = <PageLoadingBar />;

export function Routes() {
  const user = useSelector(getCurrentUserSelector);
  const tenantPermissions = useSelector(getTenantPermissions);
  const isFeatureEnabled = useFeatureFlag(FEATURE_FLAG.license_gac_enabled);
  const isCustomWidgetsEnabled = useFeatureFlag(
    FEATURE_FLAG.release_custom_widgets_enabled,
  );

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
      {isCustomWidgetsEnabled && (
        <SentryRoute component={WidgetBuilder} exact path={WIDGET_BUILDER} />
      )}
      <SentryRoute component={TemplatesListLoader} path={TEMPLATES_PATH} />
      <Redirect
        exact
        from={ADMIN_SETTINGS_PATH}
        to={
          !user
            ? ADMIN_SETTINGS_PATH
            : getAdminSettingsPath(
                isFeatureEnabled,
                user?.isSuperUser || false,
                tenantPermissions,
              )
        }
      />
      <SentryRoute
        component={SettingsLoader}
        exact
        path={ADMIN_SETTINGS_CATEGORY_PATH}
      />
      <SentryRoute component={EditorLoader} path={BUILDER_PATH_DEPRECATED} />
      <SentryRoute component={AppViewerLoader} path={VIEWER_PATH_DEPRECATED} />
      <SentryRoute
        component={CustomWidgetBuilder}
        exact
        path={CUSTOM_WIDGETS_EDITOR_ID_PATH}
      />
      <SentryRoute
        component={CustomWidgetBuilder}
        exact
        path={CUSTOM_WIDGETS_EDITOR_ID_PATH_CUSTOM}
      />
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

function AppRouter(props: {
  safeCrash: boolean;
  getCurrentUser: () => void;
  getFeatureFlags: () => void;
  getCurrentTenant: () => void;
  initCurrentPage: () => void;
  fetchProductAlert: () => void;
  safeCrashCode?: ERROR_CODES;
}) {
  const {
    fetchProductAlert,
    getCurrentTenant,
    getCurrentUser,
    getFeatureFlags,
    initCurrentPage,
  } = props;
  const tenantIsLoading = useSelector(isTenantLoading);
  const currentUserIsLoading = useSelector(getCurrentUserLoading);
  const featuresIsLoading = useSelector(getFeatureFlagsFetching);

  useEffect(() => {
    getCurrentUser();
    getFeatureFlags();
    getCurrentTenant();
    initCurrentPage();
    fetchProductAlert();
  }, []);

  useBrandingTheme();

  // hide the top loader once the tenant is loaded
  useEffect(() => {
    if (
      tenantIsLoading === false &&
      currentUserIsLoading === false &&
      featuresIsLoading === false
    ) {
      const loader = document.getElementById("loader") as HTMLDivElement;

      if (loader) {
        loader.style.width = "100vw";

        setTimeout(() => {
          loader.style.opacity = "0";
        });
      }
    }
  }, [tenantIsLoading, currentUserIsLoading, featuresIsLoading]);

  if (tenantIsLoading || currentUserIsLoading || featuresIsLoading) return null;

  return (
    <Router history={history}>
      <Suspense fallback={loadingIndicator}>
        <RouteChangeListener />
        {props.safeCrash && props.safeCrashCode ? (
          <>
            <ErrorPageHeader />
            <ErrorPage code={props.safeCrashCode} />
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

export const mapStateToProps = (state: AppState) => ({
  safeCrash: getSafeCrash(state),
  safeCrashCode: getSafeCrashCode(state),
});

export const mapDispatchToProps = (dispatch: any) => ({
  getCurrentUser: () => dispatch(getCurrentUser()),
  getFeatureFlags: () => dispatch(fetchFeatureFlagsInit()),
  getCurrentTenant: () => dispatch(getCurrentTenant(false)),
  initCurrentPage: () => dispatch(initCurrentPage()),
  fetchProductAlert: () => dispatch(fetchProductAlertInit()),
});

export default connect(mapStateToProps, mapDispatchToProps)(AppRouter);
