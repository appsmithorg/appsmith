export * from "ce/AppRouter";
import { Routes as CE_Routes, SentryRoute } from "ce/AppRouter";
import React, { Suspense, useEffect } from "react";
import history from "utils/history";
import AppHeader from "pages/common/AppHeader";
import { Router, Switch } from "react-router-dom";
import ErrorPage from "pages/common/ErrorPage";
import PageLoadingBar from "pages/common/PageLoadingBar";
import ErrorPageHeader from "pages/common/ErrorPageHeader";
import type { AppState } from "@appsmith/reducers";
import { connect, useSelector } from "react-redux";

import { getSafeCrash, getSafeCrashCode } from "selectors/errorSelectors";
import { getCurrentUser } from "actions/authActions";
import { getCurrentUserLoading } from "selectors/usersSelectors";
import type { ERROR_CODES } from "@appsmith/constants/ApiConstants";
import {
  fetchFeatureFlagsInit,
  fetchProductAlertInit,
} from "actions/userActions";
import { getCurrentTenant } from "@appsmith/actions/tenantActions";
import useBrandingTheme from "utils/hooks/useBrandingTheme";
import RouteChangeListener from "RouteChangeListener";
import {
  isTenantLoading,
  isValidLicense,
} from "@appsmith/selectors/tenantSelectors";
import LicenseCheckPage from "./pages/LicenseSetup/LicenseCheckPage";
import { LICENSE_CHECK_PATH } from "constants/routes";
import { requiresLicenseCheck } from "./requiresLicenseCheck";
import { initCurrentPage } from "actions/initActions";
import ProductAlertBanner from "components/editorComponents/ProductAlertBanner";
import Walkthrough from "components/featureWalkthrough";

const loadingIndicator = <PageLoadingBar />;

const EE_Routes = requiresLicenseCheck(() => {
  return <CE_Routes />;
});

function AppRouter(props: {
  safeCrash: boolean;
  getCurrentUser: () => void;
  getFeatureFlags: () => void;
  getCurrentTenant: () => void;
  initCurrentPage: () => void;
  fetchProductAlert: () => void;
  isLicenseValid: boolean;
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
    if (tenantIsLoading === false && currentUserIsLoading === false) {
      const loader = document.getElementById("loader") as HTMLDivElement;

      if (loader) {
        loader.style.width = "100vw";

        setTimeout(() => {
          loader.style.opacity = "0";
        });
      }
    }
  }, [tenantIsLoading, currentUserIsLoading]);

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
            <Walkthrough>
              {props.isLicenseValid && <AppHeader />}
              <Switch>
                {!props.isLicenseValid && (
                  <SentryRoute
                    component={LicenseCheckPage}
                    path={LICENSE_CHECK_PATH}
                  />
                )}
                <EE_Routes />
              </Switch>
            </Walkthrough>
            <ProductAlertBanner />
          </>
        )}
      </Suspense>
    </Router>
  );
}

const mapStateToProps = (state: AppState) => ({
  safeCrash: getSafeCrash(state),
  safeCrashCode: getSafeCrashCode(state),
  isLicenseValid: isValidLicense(state),
});

const mapDispatchToProps = (dispatch: any) => ({
  getCurrentUser: () => dispatch(getCurrentUser()),
  getFeatureFlags: () => dispatch(fetchFeatureFlagsInit()),
  getCurrentTenant: () => dispatch(getCurrentTenant(false)),
  initCurrentPage: () => dispatch(initCurrentPage()),
  fetchProductAlert: () => dispatch(fetchProductAlertInit()),
});

export default connect(mapStateToProps, mapDispatchToProps)(AppRouter);
