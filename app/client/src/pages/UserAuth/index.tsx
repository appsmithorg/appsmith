import React from "react";
import { Switch, Route, useRouteMatch, useLocation } from "react-router-dom";
import { TransitionGroup, CSSTransition } from "react-transition-group";
import Login from "./Login";
import Centered from "components/designSystems/appsmith/CenteredWrapper";

import { AuthContainer, AuthCard } from "./StyledComponents";
import SignUp from "./SignUp";
import ForgotPassword from "./ForgotPassword";
import ResetPassword from "./ResetPassword";

export const UserAuth = () => {
  const { path } = useRouteMatch();
  const location = useLocation();
  return (
    <AuthContainer>
      <Centered>
        <AuthCard>
          <TransitionGroup>
            <CSSTransition key={location.key} classNames="fade" timeout={300}>
              <Switch location={location}>
                <Route exact path={`${path}/login`} component={Login} />
                <Route exact path={`${path}/signup`} component={SignUp} />
                <Route
                  exact
                  path={`${path}/resetPassword`}
                  component={ResetPassword}
                />
                <Route
                  exact
                  path={`${path}/forgotPassword`}
                  component={ForgotPassword}
                />
              </Switch>
            </CSSTransition>
          </TransitionGroup>
        </AuthCard>
      </Centered>
    </AuthContainer>
  );
};

export default UserAuth;
