import React from "react";
import { Switch, Route, useRouteMatch, useLocation } from "react-router-dom";
import { TransitionGroup, CSSTransition } from "react-transition-group";
import PageWrapper from "pages/common/PageWrapper";
import Users from "pages/users";
import Settings from "./settings";
import Invite from "./invite";
import DefaultOrgPage from "./defaultOrgPage";
export const Organization = () => {
  const { path } = useRouteMatch();
  const location = useLocation();
  return (
    <PageWrapper displayName="Organization Settings">
      <TransitionGroup>
        <CSSTransition key={location.key} classNames="fade" timeout={300}>
          <Switch location={location}>
            <Route exact path={`${path}/settings`} component={Settings} />
            <Route exact path={`${path}/users`} component={Users} />
            <Route exact path={`${path}/invite`} component={Invite} />
            <Route component={DefaultOrgPage} />
          </Switch>
        </CSSTransition>
      </TransitionGroup>
    </PageWrapper>
  );
};

export default Organization;
