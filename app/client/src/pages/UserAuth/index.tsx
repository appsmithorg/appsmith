import React from "react";
import { Switch, useRouteMatch, useLocation, Route } from "react-router-dom";
import Login from "./Login";
import { AuthContainer, AuthCard, AuthCardContainer } from "./StyledComponents";
import SignUp from "./SignUp";
import ForgotPassword from "./ForgotPassword";
import ResetPassword from "./ResetPassword";
import PageNotFound from "pages/common/PageNotFound";
import FooterLinks from "./FooterLinks";
import * as Sentry from "@sentry/react";
const SentryRoute = Sentry.withSentryRouting(Route);

export const UserAuth = () => {
  const { path } = useRouteMatch();
  const location = useLocation();

  return (
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
  );
};

export default UserAuth;
