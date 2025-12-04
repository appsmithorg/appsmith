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
    <Switch location={location}>
      <SentryRoute
        component={() => (
          <PageWrapper displayName="Workspace Settings">
            <Settings />
          </PageWrapper>
        )}
        path={`${path}/:workspaceId/settings`}
      />
      <SentryRoute
        path={`${path}/:workspaceId/datasources`}
        render={({ match }: { match: { params: { workspaceId: string } } }) => (
          <WorkspaceDatasourcesPage workspaceId={match.params.workspaceId} />
        )}
      />
      <SentryRoute
        path={`${path}/:workspaceId/datasource/:datasourceId`}
        render={({ match }: { match: { params: { workspaceId: string } } }) => (
          <WorkspaceDatasourcesPage workspaceId={match.params.workspaceId} />
        )}
      />
      <SentryRoute
        component={() => (
          <PageWrapper displayName="Workspace Settings">
            <DefaultWorkspacePage />
          </PageWrapper>
        )}
      />
    </Switch>
  );
}

export default Workspace;
