import React, { Suspense, useEffect } from "react";
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
import LandingScreen from "./LandingScreen";
import UserAuth from "pages/UserAuth";
import Users from "pages/users";
import ErrorPage from "pages/common/ErrorPage";
import PageNotFound from "pages/common/ErrorPages/PageNotFound";
import PageLoadingBar from "pages/common/PageLoadingBar";
import ErrorPageHeader from "pages/common/ErrorPageHeader";
import { AppState } from "@appsmith/reducers";
import { connect, useSelector } from "react-redux";
import { polyfillCountryFlagEmojis } from "country-flag-emoji-polyfill";

import * as Sentry from "@sentry/react";
import { getSafeCrash, getSafeCrashCode } from "selectors/errorSelectors";
import UserProfile from "pages/UserProfile";
import { getCurrentUser } from "actions/authActions";
import { selectFeatureFlags } from "selectors/usersSelectors";
import Setup from "pages/setup";
import Settings from "@appsmith/pages/AdminSettings";
import SignupSuccess from "pages/setup/SignupSuccess";
import { ERROR_CODES } from "@appsmith/constants/ApiConstants";
import TemplatesListLoader from "pages/Templates/loader";
import { fetchFeatureFlagsInit } from "actions/userActions";
import FeatureFlags from "entities/FeatureFlags";
import WDSPage from "components/wds/Showcase";
import { getCurrentTenant } from "@appsmith/actions/tenantActions";
import { getDefaultAdminSettingsPath } from "@appsmith/utils/adminSettingsHelpers";
import { getCurrentUser as getCurrentUserSelector } from "selectors/usersSelectors";
import { getTenantPermissions } from "@appsmith/selectors/tenantSelectors";
import useBrandingTheme from "utils/hooks/useBrandingTheme";

/*
    We use this polyfill to show emoji flags
    on windows devices, this polyfill loads a font family
  */
polyfillCountryFlagEmojis();

const SentryRoute = Sentry.withSentryRouting(Route);

const loadingIndicator = <PageLoadingBar />;

function AppRouter(props: {
  safeCrash: boolean;
  getCurrentUser: () => void;
  getFeatureFlags: () => void;
  getCurrentTenant: () => void;
  safeCrashCode?: ERROR_CODES;
  featureFlags: FeatureFlags;
}) {
  const { getCurrentTenant, getCurrentUser, getFeatureFlags } = props;
  useEffect(() => {
    getCurrentUser();
    getFeatureFlags();
    getCurrentTenant();
  }, []);

  useBrandingTheme();

  const user = useSelector(getCurrentUserSelector);
  const tenantPermissions = useSelector(getTenantPermissions);

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
  safeCrash: getSafeCrash(state),
  safeCrashCode: getSafeCrashCode(state),
  featureFlags: selectFeatureFlags(state),
});

const mapDispatchToProps = (dispatch: any) => ({
  getCurrentUser: () => dispatch(getCurrentUser()),
  getFeatureFlags: () => dispatch(fetchFeatureFlagsInit()),
  getCurrentTenant: () => dispatch(getCurrentTenant()),
});

export default connect(mapStateToProps, mapDispatchToProps)(AppRouter);
