import React from "react";
import { Route, Switch, useLocation, useRouteMatch } from "react-router-dom";
import Login from "@appsmith/pages/UserAuth/Login";
import { AuthCard, AuthCardContainer, AuthContainer } from "./StyledComponents";
import SignUp from "@appsmith/pages/UserAuth/SignUp";
import ForgotPassword from "./ForgotPassword";
import ResetPassword from "./ResetPassword";
import PageNotFound from "pages/common/PageNotFound";
import * as Sentry from "@sentry/react";
import { requiresUnauth } from "./requiresAuthHOC";
import { useSelector } from "react-redux";
import { getThemeDetails, ThemeMode } from "selectors/themeSelectors";
import { AppState } from "@appsmith/reducers";
import styled, { ThemeProvider } from "styled-components";
import { Link } from "design-system";

const SentryRoute = Sentry.withSentryRouting(Route);

// TODO: replace with container from design-system
const FooterLink = styled.div`
  padding: var(--ads-spaces-9);
  display: flex;
  align-items: center;
  justify-content: space-around;
  width: 100%;
  max-width: 440px;
`;

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
        <FooterLink>
          <Link target="_blank" to="/privacy-policy.html">
            Privacy Policy
          </Link>
          <Link target="_blank" to="/terms-and-conditions.html">
            Terms and conditions
          </Link>
        </FooterLink>
      </AuthContainer>
    </ThemeProvider>
  );
}

export default requiresUnauth(UserAuth);
