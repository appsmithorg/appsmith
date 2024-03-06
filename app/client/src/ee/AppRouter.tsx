export * from "ce/AppRouter";
import { Routes as CE_Routes, SentryRoute } from "ce/AppRouter";
import React, { Suspense, useEffect } from "react";
import history from "utils/history";
import AppHeader from "@appsmith/pages/common/AppHeader";
import { Router, Switch } from "react-router-dom";
import ErrorPage from "pages/common/ErrorPage";
import PageLoadingBar from "pages/common/PageLoadingBar";
import ErrorPageHeader from "pages/common/ErrorPageHeader";
import { useDispatch, useSelector } from "react-redux";

import {
  getCurrentUserLoading,
  getFeatureFlagsFetching,
} from "selectors/usersSelectors";
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
import { useFeatureFlag } from "utils/hooks/useFeatureFlag";
import { FEATURE_FLAG } from "@appsmith/entities/FeatureFlag";
import { getIsConsolidatedPageLoading } from "selectors/ui";
import { initCurrentPage } from "actions/initActions";
import { getSafeCrash, getSafeCrashCode } from "selectors/errorSelectors";
import type { ERROR_CODES } from "@appsmith/constants/ApiConstants";

const loadingIndicator = <PageLoadingBar />;

const EE_Routes = requiresLicenseCheck(() => {
  return <CE_Routes />;
});

function AppRouter() {
  const isLicenseValid = useSelector(isValidLicense);
  const safeCrash: boolean = useSelector(getSafeCrash);
  const safeCrashCode: ERROR_CODES | undefined = useSelector(getSafeCrashCode);

  const tenantIsLoading = useSelector(isTenantLoading);
  const currentUserIsLoading = useSelector(getCurrentUserLoading);
  const showQueryModule = useSelector(getShowQueryModule);
  const showWorkflows = useSelector(getShowWorkflowFeature);
  const featuresIsLoading = useSelector(getFeatureFlagsFetching);
  const isConsolidatedPageLoading = useSelector(getIsConsolidatedPageLoading);
  const dispatch = useDispatch();
  const isConsolidatedFetchEnabled = useFeatureFlag(
    FEATURE_FLAG.rollout_consolidated_page_load_fetch_enabled,
  );

  useEffect(() => {
    dispatch(initCurrentPage());
  }, []);

  useBrandingTheme();
  let isLoading: boolean;
  if (isConsolidatedFetchEnabled) {
    isLoading = isConsolidatedPageLoading;
  } else {
    isLoading = tenantIsLoading || currentUserIsLoading || featuresIsLoading;
  }
  // hide the top loader once the tenant is loaded
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
              {isLicenseValid && <AppHeader />}
              <Switch>
                {!isLicenseValid && (
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

export default AppRouter;
