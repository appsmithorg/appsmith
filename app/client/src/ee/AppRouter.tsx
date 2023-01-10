export * from "ce/AppRouter";
import { Routes as CE_Routes, SentryRoute } from "ce/AppRouter";
import React, { Suspense, useEffect } from "react";
import history from "utils/history";
import AppHeader from "pages/common/AppHeader";
import { Redirect, Router, Switch } from "react-router-dom";
import ErrorPage from "pages/common/ErrorPage";
import PageLoadingBar from "pages/common/PageLoadingBar";
import ErrorPageHeader from "pages/common/ErrorPageHeader";
import { AppState } from "@appsmith/reducers";
import { connect, useSelector } from "react-redux";
import { polyfillCountryFlagEmojis } from "country-flag-emoji-polyfill";

import { getSafeCrash, getSafeCrashCode } from "selectors/errorSelectors";
import { getCurrentUser } from "actions/authActions";
import { selectFeatureFlags } from "selectors/usersSelectors";
import { ERROR_CODES } from "@appsmith/constants/ApiConstants";
import { fetchFeatureFlagsInit } from "actions/userActions";
import FeatureFlags from "entities/FeatureFlags";
import { getCurrentTenant } from "@appsmith/actions/tenantActions";
import useBrandingTheme from "utils/hooks/useBrandingTheme";
import RouteChangeListener from "RouteChangeListener";
import {
  isTenantLoading,
  isValidLicense,
} from "@appsmith/selectors/tenantSelectors";
import {
  AUTH_LOGIN_URL,
  BASE_LOGIN_URL,
  BASE_SIGNUP_URL,
  BASE_URL,
  LICENSE_CHECK_PATH,
  SIGN_UP_URL,
  USER_AUTH_URL,
} from "constants/routes";
import LicenseCheckPage from "./pages/setup/LicenseCheckPage";
import UserAuth from "pages/UserAuth";
import { getCurrentUser as getCurrentUserSelector } from "selectors/usersSelectors";
import LandingScreen from "LandingScreen";

/*
    We use this polyfill to show emoji flags
    on windows devices, this polyfill loads a font family
  */
polyfillCountryFlagEmojis();

const loadingIndicator = <PageLoadingBar />;

function AppRouter(props: {
  safeCrash: boolean;
  getCurrentUser: () => void;
  getFeatureFlags: () => void;
  getCurrentTenant: () => void;
  validateLicense?: () => void;
  isLoading: boolean;
  isLicenseValid: boolean;
  safeCrashCode?: ERROR_CODES;
  featureFlags: FeatureFlags;
}) {
  const { getCurrentTenant, getCurrentUser, getFeatureFlags } = props;

  const isUsageAndBillingEnabled = props.featureFlags.USAGE_AND_BILLING;

  useEffect(() => {
    getCurrentUser();
    getFeatureFlags();
    getCurrentTenant();
  }, []);

  useBrandingTheme();

  const user = useSelector(getCurrentUserSelector);

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
            {isUsageAndBillingEnabled ? (
              props.isLicenseValid && <AppHeader />
            ) : (
              <AppHeader />
            )}
            <Switch>
              <SentryRoute component={LandingScreen} exact path={BASE_URL} />
              <Redirect exact from={BASE_LOGIN_URL} to={AUTH_LOGIN_URL} />
              <Redirect exact from={BASE_SIGNUP_URL} to={SIGN_UP_URL} />
              <SentryRoute component={UserAuth} path={USER_AUTH_URL} />
              {isUsageAndBillingEnabled &&
                !props.isLoading &&
                !props.isLicenseValid &&
                !user?.emptyInstance && (
                  <>
                    <Redirect from="*" to={LICENSE_CHECK_PATH} />
                    <SentryRoute
                      component={LicenseCheckPage}
                      exact
                      path="/license-check"
                    />
                  </>
                )}
              <CE_Routes />
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
  isLoading: isTenantLoading(state),
  isLicenseValid: isValidLicense(state),
});

const mapDispatchToProps = (dispatch: any) => ({
  getCurrentUser: () => dispatch(getCurrentUser()),
  getFeatureFlags: () => dispatch(fetchFeatureFlagsInit()),
  getCurrentTenant: () => dispatch(getCurrentTenant()),
});

export default connect(mapStateToProps, mapDispatchToProps)(AppRouter);
