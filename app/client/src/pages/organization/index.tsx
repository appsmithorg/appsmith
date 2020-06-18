import React from "react";
import { Switch, useRouteMatch, useLocation } from "react-router-dom";
import PageWrapper from "pages/common/PageWrapper";
import Settings from "./settings";
import Invite from "./invite";
import DefaultOrgPage from "./defaultOrgPage";
import AppRoute from "pages/common/AppRoute";
export const Organization = () => {
  const { path } = useRouteMatch();
  const location = useLocation();
  return (
    <PageWrapper displayName="Organization Settings">
      <Switch location={location}>
        <AppRoute
          exact
          path={`${path}/:orgId/settings`}
          component={Settings}
          name={"Settings"}
        />
        <AppRoute
          exact
          path={`${path}/invite`}
          component={Invite}
          name={"Invite"}
        />
        <AppRoute component={DefaultOrgPage} name={"DefaultOrgPage"} />
      </Switch>
    </PageWrapper>
  );
};

export default Organization;
