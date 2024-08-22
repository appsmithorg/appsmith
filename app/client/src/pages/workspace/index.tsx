import React from "react";

import * as Sentry from "@sentry/react";
import PageWrapper from "pages/common/PageWrapper";
import { Route, Switch, useLocation, useRouteMatch } from "react-router-dom";

import DefaultWorkspacePage from "./defaultWorkspacePage";
import Settings from "./settings";

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
