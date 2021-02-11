import React from "react";
import { Route, Switch, useLocation, useRouteMatch } from "react-router-dom";
import Login from "./Login";
import { AuthCard, AuthCardContainer, AuthContainer } from "./StyledComponents";
import SignUp from "./SignUp";
import ForgotPassword from "./ForgotPassword";
import ResetPassword from "./ResetPassword";
import PageNotFound from "pages/common/PageNotFound";
import FooterLinks from "./FooterLinks";
import * as Sentry from "@sentry/react";
import requiresAuthHOC from "./requiresAuthHOC";
import { useSelector } from "react-redux";
import { getThemeDetails, ThemeMode } from "selectors/themeSelectors";
import { AppState } from "reducers";
import { ThemeProvider } from "styled-components";

const SentryRoute = Sentry.withSentryRouting(Route);

export const UserAuth = () => {
  const { path } = useRouteMatch();
  const location = useLocation();
  const darkTheme = useSelector((state: AppState) =>
    getThemeDetails(state, ThemeMode.DARK),
  );

  return (
    <ThemeProvider theme={darkTheme}>
      <AuthContainer>
        <AuthCardContainer>
          <AuthCard>
            <Switch location={location}>
              <SentryRoute exact path={`${path}/login`} component={Login} />
              <SentryRoute exact path={`${path}/signup`} component={SignUp} />
              <SentryRoute
                exact
                path={`${path}/resetPassword`}
                component={ResetPassword}
              />
              <SentryRoute
                exact
                path={`${path}/forgotPassword`}
                component={ForgotPassword}
              />
              <SentryRoute component={PageNotFound} />
            </Switch>
          </AuthCard>
        </AuthCardContainer>
        <FooterLinks />
      </AuthContainer>
    </ThemeProvider>
  );
};

export default requiresAuthHOC(UserAuth);
