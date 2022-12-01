import React from "react";
import { Switch, useRouteMatch, useLocation, Route } from "react-router-dom";
import PageWrapper from "pages/common/PageWrapper";
import DefaultWorkspacePage from "./defaultWorkspacePage";
import Settings from "./settings";
import * as Sentry from "@sentry/react";
const SentryRoute = Sentry.withSentryRouting(Route);

export function Workspace() {
  const { path } = useRouteMatch();
  const location = useLocation();
  return (
    <PageWrapper displayName="Workspace Settings">
      <Switch location={location}>
        <SentryRoute
          component={Settings}
          path={`${path}/:workspaceId/settings`}
        />
        <SentryRoute component={DefaultWorkspacePage} />
      </Switch>
    </PageWrapper>
  );
}

export default Workspace;
