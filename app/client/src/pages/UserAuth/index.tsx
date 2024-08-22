import React from "react";

import * as Sentry from "@sentry/react";
import { getAppsmithConfigs } from "ee/configs";
import type { AppState } from "ee/reducers";
import { getTenantConfig } from "ee/selectors/tenantSelectors";
import { getAssetUrl } from "ee/utils/airgapHelpers";
import Login from "pages/UserAuth/Login";
import SignUp from "pages/UserAuth/SignUp";
import PageNotFound from "pages/common/ErrorPages/PageNotFound";
import { useSelector } from "react-redux";
import { Route, Switch, useLocation, useRouteMatch } from "react-router-dom";
import { ThemeMode, getThemeDetails } from "selectors/themeSelectors";
import { ThemeProvider } from "styled-components";
import { useIsMobileDevice } from "utils/hooks/useDeviceDetect";

import FooterLinks from "./FooterLinks";
import ForgotPassword from "./ForgotPassword";
import ResetPassword from "./ResetPassword";
import VerificationError from "./VerificationError";
import VerificationPending from "./VerificationPending";
import VerifyUser from "./VerifyUser";
import { requiresUnauth } from "./requiresAuthHOC";

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
      {/* TODO: (Albin) - chnages this to ads-v2 variable once  branding is sorted out. */}
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
        {cloudHosting && <FooterLinks />}
      </div>
    </ThemeProvider>
  );
}

export default requiresUnauth(UserAuth);
