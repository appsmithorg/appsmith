import React from "react";
import { useSelector } from "react-redux";
import {
  Switch,
  useRouteMatch,
  useLocation,
  Route,
  Redirect,
} from "react-router-dom";
import Login from "./Login";
import { AuthContainer, AuthCard, AuthCardContainer } from "./StyledComponents";
import SignUp from "./SignUp";
import ForgotPassword from "./ForgotPassword";
import ResetPassword from "./ResetPassword";
import PageNotFound from "pages/common/PageNotFound";
import FooterLinks from "./FooterLinks";
import * as Sentry from "@sentry/react";
const SentryRoute = Sentry.withSentryRouting(Route);

import { getCurrentUser } from "selectors/usersSelectors";
import { ANONYMOUS_USERNAME } from "constants/userConstants";
import { APPLICATIONS_URL } from "constants/routes";

export const UserAuth = () => {
  const { path } = useRouteMatch();
  const location = useLocation();
  const user = useSelector(getCurrentUser);

  if (user?.email && user?.email !== ANONYMOUS_USERNAME) {
    return <Redirect to={APPLICATIONS_URL} />;
  }

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
