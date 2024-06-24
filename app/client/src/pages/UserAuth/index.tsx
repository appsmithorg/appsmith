import React, { lazy, Suspense } from "react";
import { Route, Switch, useLocation, useRouteMatch } from "react-router-dom";
const Login = lazy(() => import("pages/UserAuth/Login"));
const SignUp = lazy(() => import("pages/UserAuth/SignUp"));
const ForgotPassword = lazy(() => import("./ForgotPassword"));
const ResetPassword = lazy(() => import("./ResetPassword"));
const PageNotFound = lazy(() => import("pages/common/ErrorPages/PageNotFound"));
const VerificationPending = lazy(() => import("./VerificationPending"));
const VerifyUser = lazy(() => import("./VerifyUser"));
const VerificationError = lazy(() => import("./VerificationError"));
import * as Sentry from "@sentry/react";
import { requiresUnauth } from "./requiresAuthHOC";
import { useSelector } from "react-redux";
import { getThemeDetails, ThemeMode } from "selectors/themeSelectors";
import type { AppState } from "@appsmith/reducers";
import { ThemeProvider } from "styled-components";
import FooterLinks from "./FooterLinks";
import { useIsMobileDevice } from "utils/hooks/useDeviceDetect";
import { getAssetUrl } from "@appsmith/utils/airgapHelpers";
import { getTenantConfig } from "@appsmith/selectors/tenantSelectors";
import { getAppsmithConfigs } from "@appsmith/configs";

const SentryRoute = Sentry.withSentryRouting(Route);

export function UserAuth() {
  const { path } = useRouteMatch();
  const location = useLocation();
  const lightTheme = useSelector((state: AppState) =>
    getThemeDetails(state, ThemeMode.LIGHT),
  );
  const isMobileDevice = useIsMobileDevice();
  const tenantConfig = useSelector(getTenantConfig);
  const { cloudHosting } = getAppsmithConfigs();

  return (
    <ThemeProvider theme={lightTheme}>
      {/* TODO: (Albin) - changes this to ads-v2 variable once branding is sorted out. */}
      <div
        className={`absolute inset-0 flex flex-col overflow-y-auto auth-container bg-[color:var(--ads-color-background-secondary)] ${
          !isMobileDevice ? "p-4" : "px-6 py-12"
        } t--auth-container justify-between`}
      >
        {isMobileDevice && (
          <img
            className="h-8 mx-auto"
            src={getAssetUrl(tenantConfig.brandLogoUrl)}
          />
        )}
        <Suspense fallback={<div>Loading...</div>}>
          <Switch location={location}>
            <SentryRoute component={Login} exact path={`${path}/login`} />
            <SentryRoute component={SignUp} exact path={`${path}/signup`} />
            <SentryRoute
              component={ResetPassword}
              exact
              path={`${path}/resetPassword`}
            />
            <SentryRoute
              component={ForgotPassword}
              exact
              path={`${path}/forgotPassword`}
            />
            <SentryRoute
              component={VerificationPending}
              exact
              path={`${path}/verificationPending`}
            />
            <SentryRoute component={VerifyUser} exact path={`${path}/verify`} />
            <SentryRoute
              component={VerificationError}
              exact
              path={`${path}/verify-error`}
            />
            <SentryRoute component={PageNotFound} />
          </Switch>
        </Suspense>
        {cloudHosting && <FooterLinks />}
      </div>
    </ThemeProvider>
  );
}

export default requiresUnauth(UserAuth);