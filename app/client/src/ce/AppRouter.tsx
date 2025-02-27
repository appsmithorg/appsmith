import React, { Suspense, useEffect } from "react";
import history from "utils/history";
import AppHeader from "ee/pages/common/AppHeader";
import { Redirect, Router, Switch } from "react-router-dom";
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
  CUSTOM_WIDGETS_DEPRECATED_EDITOR_ID_PATH,
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
  WORKSPACE_URL,
} from "constants/routes";
import WorkspaceLoader from "pages/workspace/loader";
import ApplicationListLoader from "pages/Applications/loader";
import AppIDE from "pages/AppIDE/AppIDELoader";
import AppViewerLoader from "pages/AppViewer/loader";
import LandingScreen from "../LandingScreen";
import UserAuth from "pages/UserAuth";
import Users from "pages/users";
import ErrorPage from "pages/common/ErrorPage";
import PageNotFound from "pages/common/ErrorPages/PageNotFound";
import PageLoadingBar from "pages/common/PageLoadingBar";
import ErrorPageHeader from "pages/common/ErrorPageHeader";
import { useDispatch, useSelector } from "react-redux";

import { getSafeCrash, getSafeCrashCode } from "selectors/errorSelectors";
import UserProfile from "pages/UserProfile";
import Setup from "pages/setup";
import SettingsLoader from "pages/AdminSettings/loader";
import SignupSuccess from "pages/setup/SignupSuccess";
import type { ERROR_CODES } from "ee/constants/ApiConstants";
import TemplatesListLoader from "pages/Templates/loader";
import { getCurrentUser as getCurrentUserSelector } from "selectors/usersSelectors";
import { getOrganizationPermissions } from "ee/selectors/organizationSelectors";
import useBrandingTheme from "utils/hooks/useBrandingTheme";
import RouteChangeListener from "RouteChangeListener";
import { initCurrentPage } from "../actions/initActions";
import Walkthrough from "components/featureWalkthrough";
import ProductAlertBanner from "components/editorComponents/ProductAlertBanner";
import { getAdminSettingsPath } from "ee/utils/BusinessFeatures/adminSettingsHelpers";
import { useFeatureFlag } from "utils/hooks/useFeatureFlag";
import { FEATURE_FLAG } from "ee/entities/FeatureFlag";
import CustomWidgetBuilderLoader from "pages/Editor/CustomWidgetBuilder/loader";
import { getIsConsolidatedPageLoading } from "selectors/ui";
import { useFeatureFlagOverride } from "utils/hooks/useFeatureFlagOverride";
import { SentryRoute } from "components/SentryRoute";

export const loadingIndicator = <PageLoadingBar />;

export function Routes() {
  const user = useSelector(getCurrentUserSelector);
  const organizationPermissions = useSelector(getOrganizationPermissions);
  const isFeatureEnabled = useFeatureFlag(FEATURE_FLAG.license_gac_enabled);

  useFeatureFlagOverride();

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
            : getAdminSettingsPath(
                isFeatureEnabled,
                user?.isSuperUser || false,
                organizationPermissions,
              )
        }
      />
      <SentryRoute
        component={SettingsLoader}
        exact
        path={ADMIN_SETTINGS_CATEGORY_PATH}
      />
      <SentryRoute
        component={CustomWidgetBuilderLoader}
        exact
        path={CUSTOM_WIDGETS_DEPRECATED_EDITOR_ID_PATH}
      />
      <SentryRoute component={AppIDE} path={BUILDER_PATH_DEPRECATED} />
      <SentryRoute component={AppViewerLoader} path={VIEWER_PATH_DEPRECATED} />
      <SentryRoute
        component={CustomWidgetBuilderLoader}
        exact
        path={CUSTOM_WIDGETS_EDITOR_ID_PATH}
      />
      <SentryRoute
        component={CustomWidgetBuilderLoader}
        exact
        path={CUSTOM_WIDGETS_EDITOR_ID_PATH_CUSTOM}
      />
      {/*
       * Note: When making changes to the order of these paths
       * Be sure to check if it is sync with the order of checks in getUpdatedRoute helper method
       * Context: https://github.com/appsmithorg/appsmith/pull/19833
       */}
      <SentryRoute component={AppIDE} path={BUILDER_PATH} />
      <SentryRoute component={AppIDE} path={BUILDER_CUSTOM_PATH} />
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

export default function AppRouter() {
  const safeCrash: boolean = useSelector(getSafeCrash);
  const safeCrashCode: ERROR_CODES | undefined = useSelector(getSafeCrashCode);
  const isConsolidatedPageLoading = useSelector(getIsConsolidatedPageLoading);
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(initCurrentPage());
  }, []);

  useBrandingTheme();

  const isLoading = isConsolidatedPageLoading;

  // hide the top loader once the organization is loaded
  useEffect(() => {
    if (!isLoading) {
      const loader = document.getElementById("loader") as HTMLDivElement;

      if (loader) {
        loader.style.width = "100vw";
        setTimeout(() => {
          loader.style.opacity = "0";
        });
      }
    }
  }, [isLoading]);

  if (isLoading) return null;

  return (
    <Router history={history}>
      <Suspense fallback={loadingIndicator}>
        <RouteChangeListener />
        {safeCrash && safeCrashCode ? (
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
