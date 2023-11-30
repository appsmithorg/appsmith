export * from "ce/AppRouter";
import {
  Routes as CE_Routes,
  SentryRoute,
  mapStateToProps as CE_mapStateToProps,
  mapDispatchToProps as CE_mapDispatchToProps,
} from "ce/AppRouter";
import React, { Suspense, useEffect } from "react";
import history from "utils/history";
import AppHeader from "@appsmith/pages/common/AppHeader";
import { Router, Switch } from "react-router-dom";
import ErrorPage from "pages/common/ErrorPage";
import PageLoadingBar from "pages/common/PageLoadingBar";
import ErrorPageHeader from "pages/common/ErrorPageHeader";
import type { AppState } from "@appsmith/reducers";
import { connect, useSelector } from "react-redux";

import {
  getCurrentUserLoading,
  getFeatureFlagsFetching,
} from "selectors/usersSelectors";
import type { ERROR_CODES } from "@appsmith/constants/ApiConstants";
import useBrandingTheme from "utils/hooks/useBrandingTheme";
import RouteChangeListener from "RouteChangeListener";
import {
  isTenantLoading,
  isValidLicense,
} from "@appsmith/selectors/tenantSelectors";
import LicenseCheckPage from "./pages/LicenseSetup/LicenseCheckPage";
import { LICENSE_CHECK_PATH, MIGRATIONS_URL } from "constants/routes";
import { requiresLicenseCheck } from "./requiresLicenseCheck";
import ProductAlertBanner from "components/editorComponents/ProductAlertBanner";
import Walkthrough from "components/featureWalkthrough";
import PackageEditorLoader from "./pages/Editor/PackageEditor/PackageEditorLoader";
import { PACKAGE_EDITOR_PATH } from "@appsmith/constants/routes/packageRoutes";
import { getShowQueryModule } from "@appsmith/selectors/moduleFeatureSelectors";
import { Migrations } from "./pages/Billing/Migrations";
import { WORKFLOW_EDITOR_URL } from "./constants/routes/workflowRoutes";
import WorkflowEditorLoader from "./pages/Editor/WorkflowEditor/WorkflowEditorLoader";
import { getShowWorkflowFeature } from "./selectors/workflowSelectors";

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
  const showQueryModule = useSelector(getShowQueryModule);
  const showWorkflows = useSelector(getShowWorkflowFeature);
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
              {props.isLicenseValid && <AppHeader />}
              <Switch>
                {!props.isLicenseValid && (
                  <SentryRoute
                    component={LicenseCheckPage}
                    path={LICENSE_CHECK_PATH}
                  />
                )}

                {showWorkflows && (
                  <SentryRoute
                    component={WorkflowEditorLoader}
                    path={WORKFLOW_EDITOR_URL}
                  />
                )}

                {showQueryModule && (
                  <SentryRoute
                    component={PackageEditorLoader}
                    path={PACKAGE_EDITOR_PATH}
                  />
                )}
                <SentryRoute component={Migrations} path={MIGRATIONS_URL} />
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

const mapStateToProps = (state: AppState) => {
  const ceMapStateToProps = CE_mapStateToProps(state);
  return {
    ...ceMapStateToProps,
    isLicenseValid: isValidLicense(state),
  };
};

const mapDispatchToProps = (dispatch: any) => {
  const ceMapDispatchToProps = CE_mapDispatchToProps(dispatch);
  return {
    ...ceMapDispatchToProps,
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(AppRouter);
