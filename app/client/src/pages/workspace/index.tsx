import React from "react";
import { Switch, useRouteMatch, useLocation } from "react-router-dom";
import PageWrapper from "pages/common/PageWrapper";
import DefaultWorkspacePage from "./defaultWorkspacePage";
import Settings from "./settings";
import { WorkspaceDatasourcesPage } from "./WorkspaceDatasourcesPage";
import { SentryRoute } from "components/SentryRoute";

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
        <SentryRoute
          component={({
            match,
          }: {
            match: { params: { workspaceId: string } };
          }) => (
            <WorkspaceDatasourcesPage workspaceId={match.params.workspaceId} />
          )}
          path={`${path}/:workspaceId/datasources`}
        />
        <SentryRoute component={DefaultWorkspacePage} />
      </Switch>
    </PageWrapper>
  );
}

export default Workspace;
