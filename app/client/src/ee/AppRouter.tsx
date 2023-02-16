export * from "ce/AppRouter";
import { Routes as CE_Routes, SentryRoute } from "ce/AppRouter";
import React, { Suspense, useEffect } from "react";
import history from "utils/history";
import AppHeader from "pages/common/AppHeader";
import { Router, Switch } from "react-router-dom";
import ErrorPage from "pages/common/ErrorPage";
import PageLoadingBar from "pages/common/PageLoadingBar";
import ErrorPageHeader from "pages/common/ErrorPageHeader";
import { AppState } from "@appsmith/reducers";
import { connect, useSelector } from "react-redux";
import { polyfillCountryFlagEmojis } from "country-flag-emoji-polyfill";

import { getSafeCrash, getSafeCrashCode } from "selectors/errorSelectors";
import { getCurrentUser } from "actions/authActions";
import {
  getCurrentUserLoading,
  selectFeatureFlags,
} from "selectors/usersSelectors";
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
import LicenseCheckPage from "./pages/setup/LicenseCheckPage";
import { LICENSE_CHECK_PATH } from "constants/routes";
import { requiresLicenseCheck } from "./requiresLicenseCheck";

/*
    We use this polyfill to show emoji flags
    on windows devices, this polyfill loads a font family
  */
polyfillCountryFlagEmojis();

const loadingIndicator = <PageLoadingBar />;

const EE_Routes = requiresLicenseCheck(() => {
  return <CE_Routes />;
});

function AppRouter(props: {
  safeCrash: boolean;
  getCurrentUser: () => void;
  getFeatureFlags: () => void;
  getCurrentTenant: () => void;
  isLicenseValid: boolean;
  safeCrashCode?: ERROR_CODES;
  featureFlags: FeatureFlags;
}) {
  const { getCurrentTenant, getCurrentUser, getFeatureFlags } = props;
  const tenantIsLoading = useSelector(isTenantLoading);
  const currentUserIsLoading = useSelector(getCurrentUserLoading);
  const isUsageAndBillingEnabled = props.featureFlags.USAGE_AND_BILLING;

  useEffect(() => {
    getCurrentUser();
    getFeatureFlags();
    getCurrentTenant();
  }, []);

  useBrandingTheme();

  // hide the top loader once the tenant is loaded
  useEffect(() => {
    if (tenantIsLoading === false && currentUserIsLoading === false) {
      const loader = document.getElementById("loader") as HTMLDivElement;

      if (loader) {
        loader.style.width = "100vw";

        setTimeout(() => {
          loader.style.opacity = "0";
        });
      }
    }
  }, [tenantIsLoading]);

  if (tenantIsLoading || currentUserIsLoading) return null;

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
              {isUsageAndBillingEnabled && !props.isLicenseValid && (
                <SentryRoute
                  component={LicenseCheckPage}
                  path={LICENSE_CHECK_PATH}
                />
              )}
              <EE_Routes />
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
  isLicenseValid: isValidLicense(state),
});

const mapDispatchToProps = (dispatch: any) => ({
  getCurrentUser: () => dispatch(getCurrentUser()),
  getFeatureFlags: () => dispatch(fetchFeatureFlagsInit()),
  getCurrentTenant: () => dispatch(getCurrentTenant()),
});

export default connect(mapStateToProps, mapDispatchToProps)(AppRouter);
