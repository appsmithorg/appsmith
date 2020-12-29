import React from "react";
import { Switch, useRouteMatch, useLocation, Route } from "react-router-dom";
import Login from "./Login";
import Centered from "components/designSystems/appsmith/CenteredWrapper";
import { animated, useTransition } from "react-spring";
import { AuthContainer, AuthCard } from "./StyledComponents";
import SignUp from "./SignUp";
import ForgotPassword from "./ForgotPassword";
import ResetPassword from "./ResetPassword";
import PageNotFound from "pages/common/PageNotFound";
import * as Sentry from "@sentry/react";
const SentryRoute = Sentry.withSentryRouting(Route);

const AnimatedAuthCard = animated(AuthContainer);
export const UserAuth = () => {
  const { path } = useRouteMatch();
  const location = useLocation();
  const transitions = useTransition(location, (location) => location.pathname, {
    from: { opacity: 0, transform: "translate3d(50%,0,0)" },
    enter: { opacity: 1, transform: "translate3d(0%,0,0)" },
    leave: { opacity: 0, transform: "translate3d(-50%,0,0)" },
    reset: true,
  });
  const renderTransitions = transitions.map(
    ({ item: location, props, key }) => (
      <AnimatedAuthCard key={key} style={props}>
        <Centered>
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
        </Centered>
      </AnimatedAuthCard>
    ),
  );
  return <React.Fragment>{renderTransitions}</React.Fragment>;
};

export default UserAuth;
