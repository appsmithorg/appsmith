import React from "react";
import { Switch, useRouteMatch, useLocation, Route } from "react-router-dom";
import PageWrapper from "pages/common/PageWrapper";
import DefaultOrgPage from "./defaultOrgPage";
import Settings from "./settings";
import * as Sentry from "@sentry/react";
const SentryRoute = Sentry.withSentryRouting(Route);

export function Organization() {
  const { path } = useRouteMatch();
  const location = useLocation();
  return (
    <PageWrapper displayName="Organization Settings">
      <Switch location={location}>
        <SentryRoute component={Settings} path={`${path}/:orgId/settings`} />
        <SentryRoute component={DefaultOrgPage} />
      </Switch>
    </PageWrapper>
  );
}

export default Organization;
