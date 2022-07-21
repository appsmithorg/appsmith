import React from "react";
import { Route, Switch, useLocation, useRouteMatch } from "react-router-dom";
import Login from "@appsmith/pages/UserAuth/Login";
import { AuthCard, AuthCardContainer, AuthContainer } from "./StyledComponents";
import SignUp from "@appsmith/pages/UserAuth/SignUp";
import ForgotPassword from "./ForgotPassword";
import ResetPassword from "./ResetPassword";
import PageNotFound from "pages/common/PageNotFound";
import FooterLinks from "./FooterLinks";
import * as Sentry from "@sentry/react";
import { requiresUnauth } from "./requiresAuthHOC";
import { useSelector } from "react-redux";
import { getThemeDetails, ThemeMode } from "selectors/themeSelectors";
import { AppState } from "reducers";
import { ThemeProvider } from "styled-components";

const SentryRoute = Sentry.withSentryRouting(Route);

export function UserAuth() {
  const { path } = useRouteMatch();
  const location = useLocation();
  const lightTheme = useSelector((state: AppState) =>
    getThemeDetails(state, ThemeMode.LIGHT),
  );

  return (
    <ThemeProvider theme={lightTheme}>
      <AuthContainer>
        <AuthCardContainer>
          <AuthCard>
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
              <SentryRoute component={PageNotFound} />
            </Switch>
          </AuthCard>
        </AuthCardContainer>
        <FooterLinks />
      </AuthContainer>
    </ThemeProvider>
  );
}

export default requiresUnauth(UserAuth);
