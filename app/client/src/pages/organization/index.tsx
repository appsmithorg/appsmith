import React from "react";
import { Switch, Route, useRouteMatch, useLocation } from "react-router-dom";
import PageWrapper from "pages/common/PageWrapper";
import Settings from "./settings";
import Invite from "./invite";
import DefaultOrgPage from "./defaultOrgPage";
export const Organization = () => {
  const { path } = useRouteMatch();
  const location = useLocation();
  return (
    <PageWrapper displayName="Organization Settings">
      <Switch location={location}>
        <Route exact path={`${path}/settings`} component={Settings} />
        <Route exact path={`${path}/invite`} component={Invite} />
        <Route component={DefaultOrgPage} />
      </Switch>
    </PageWrapper>
  );
};

export default Organization;
