import React, { useCallback, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Switch } from "react-router";
import { generatePath } from "react-router-dom";
import { SentryRoute } from "components/SentryRoute";
import styled from "styled-components";
import { Spinner, IDE_HEADER_HEIGHT } from "@appsmith/ads";
import CenteredWrapper from "components/designSystems/appsmith/CenteredWrapper";
import { GridContainer } from "IDE/Components/LayoutComponents";
import { DataSidePane } from "pages/Editor/DataSidePane/DataSidePane";
import CreateNewDatasourceTab from "pages/Editor/IntegrationEditor/CreateNewDatasourceTab";
import DataSourceEditor from "pages/Editor/DataSourceEditor";
import DatasourceBlankState from "pages/Editor/DataSourceEditor/DatasourceBlankState";

import { initWorkspaceDatasource } from "ee/actions/workspaceDatasourceActions";
import type { DefaultRootState } from "react-redux";
import { getDatasources } from "ee/selectors/entitiesSelector";
import {
  WORKSPACE_DATASOURCES_URL,
  WORKSPACE_DATASOURCE_EDITOR_URL,
} from "constants/routes";
import history from "utils/history";
import { createTempDatasourceFromForm } from "actions/datasourceActions";
import { TEMP_DATASOURCE_ID } from "constants/Datasource";
import type { PluginType } from "entities/Plugin";

// Page container for full viewport layout
const PageContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
  padding-top: ${IDE_HEADER_HEIGHT}px;
`;

const LeftPane = styled.div`
  background-color: var(--ads-v2-color-bg);
  border-right: 1px solid var(--ads-v2-color-border);
  overflow: hidden;
  display: flex;
  flex-direction: column;
`;

const MainPane = styled.div`
  background-color: var(--ads-v2-color-bg);
  overflow: hidden;
  display: flex;
  flex-direction: column;
`;

interface WorkspaceDatasourcesPageProps {
  workspaceId: string;
}

const WorkspaceDatasourceDefaultView = ({
  onIntegrationClick,
}: {
  onIntegrationClick?: (params: { pluginId: string; type: PluginType }) => void;
}) => {
  const datasources = useSelector(getDatasources);

  if (!datasources || datasources.length === 0) {
    return <DatasourceBlankState />;
  }

  return <CreateNewDatasourceTab onIntegrationClick={onIntegrationClick} />;
};

export const WorkspaceDatasourcesPage = (
  props: WorkspaceDatasourcesPageProps,
) => {
  const { workspaceId } = props;
  const dispatch = useDispatch();

  // Check if workspace editor is initialized
  const isWorkspaceDatasourceInitialized = useSelector(
    (state: DefaultRootState) =>
      state.ui.editor.isWorkspaceDatasourceInitialized,
  );

  // Initialize workspace IDE whenever workspaceId changes
  useEffect(() => {
    if (workspaceId) {
      dispatch(initWorkspaceDatasource({ workspaceId }));
    }
  }, [dispatch, workspaceId]);

  // Handler for add button click - navigate to /NEW
  const handleAddButtonClick = useCallback(() => {
    const url = generatePath(WORKSPACE_DATASOURCES_URL, { workspaceId });

    history.push(`${url}/NEW`);
  }, [workspaceId]);

  // Handler for datasource click - navigate to datasource/:datasourceId
  const handleDatasourceClick = useCallback(
    (datasourceId: string) => {
      const url = generatePath(WORKSPACE_DATASOURCE_EDITOR_URL, {
        workspaceId,
        datasourceId,
      });

      history.push(url);
    },
    [workspaceId],
  );

  // Handler for integration click - create temp datasource and navigate to editor
  const handleIntegrationClick = useCallback(
    (params: { pluginId: string; type: PluginType }) => {
      // Create temp datasource
      dispatch(createTempDatasourceFromForm(params));

      // Navigate to workspace datasource editor with temp ID and pluginId as query param
      const url = generatePath(WORKSPACE_DATASOURCE_EDITOR_URL, {
        workspaceId,
        datasourceId: TEMP_DATASOURCE_ID,
      });

      history.push(`${url}?pluginId=${params.pluginId}`);
    },
    [workspaceId, dispatch],
  );

  // Show loading state while workspace editor is initializing
  if (!isWorkspaceDatasourceInitialized) {
    return (
      <PageContainer>
        <CenteredWrapper
          style={{ height: `calc(100vh - ${IDE_HEADER_HEIGHT}px)` }}
        >
          <Spinner size="lg" />
        </CenteredWrapper>
      </PageContainer>
    );
  }

  return (
    <PageContainer data-testid="t--workspace-datasources-page">
      <GridContainer
        style={{
          gridTemplateColumns: "300px 1fr",
          gridTemplateRows: "100%",
          overflow: "hidden",
          flex: 1,
        }}
      >
        <LeftPane>
          <DataSidePane
            onAddButtonClick={handleAddButtonClick}
            onDatasourceClick={handleDatasourceClick}
          />
        </LeftPane>
        <MainPane>
          <Switch>
            {/* Create new datasource - use the exact same component */}
            <SentryRoute
              exact
              path={`${WORKSPACE_DATASOURCES_URL}/NEW`}
              render={() => (
                <CreateNewDatasourceTab
                  onIntegrationClick={handleIntegrationClick}
                />
              )}
            />
            {/* Edit existing datasource - using DataSourceEditor */}
            <SentryRoute
              exact
              path={WORKSPACE_DATASOURCE_EDITOR_URL}
              render={({
                match,
              }: {
                match: { params: { datasourceId: string } };
              }) => (
                <DataSourceEditor datasourceId={match.params.datasourceId} />
              )}
            />
            {/* Default list view - show "Connect a datasource" page by default */}
            <SentryRoute
              path={WORKSPACE_DATASOURCES_URL}
              render={() => (
                <WorkspaceDatasourceDefaultView
                  onIntegrationClick={handleIntegrationClick}
                />
              )}
            />
          </Switch>
        </MainPane>
      </GridContainer>
    </PageContainer>
  );
};
