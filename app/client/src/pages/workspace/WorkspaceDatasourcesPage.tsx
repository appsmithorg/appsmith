import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Switch } from "react-router";
import { SentryRoute } from "components/SentryRoute";
import styled from "styled-components";
import { Spinner, IDE_HEADER_HEIGHT } from "@appsmith/ads";
import CenteredWrapper from "components/designSystems/appsmith/CenteredWrapper";

// Import the workspace-adapted DataSidePane
import { WorkspaceDataSidePane } from "./WorkspaceDataSidePane";
import WorkspaceCreateNewDatasourceTab from "./WorkspaceCreateNewDatasourceTab";
import WorkspaceDatasourceEditor from "./WorkspaceDatasourceEditor";

// Import actions and selectors
import { getDatasourceUsageCountForApp } from "ee/selectors/entitiesSelector";
import { IDE_TYPE } from "ee/IDE/Interfaces/IDETypes";
import { getFetchedWorkspaces } from "ee/selectors/workspaceSelectors";
import { fetchAllWorkspaces } from "ee/actions/workspaceActions";
import { initWorkspaceIDE } from "ee/actions/workspaceIDEActions";
import type { DefaultRootState } from "react-redux";

// Page container for full viewport layout
const PageContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
`;

// Use the SAME layout structure as AppIDE
const IDEContainer = styled.div`
  display: grid;
  grid-template-columns: 300px 1fr;
  grid-template-rows: 100%;
  height: 100vh;
  overflow: hidden;
  flex: 1;
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

export const WorkspaceDatasourcesPage = (
  props: WorkspaceDatasourcesPageProps,
) => {
  const { workspaceId } = props;
  const dispatch = useDispatch();

  // Check if workspace editor is initialized
  const isWorkspaceEditorInitialized = useSelector(
    (state: DefaultRootState) => state.ui.editor.isWorkspaceEditorInitialized,
  );

  // Get the same Redux state that app editor components expect
  const dsUsageMap = useSelector((state) =>
    getDatasourceUsageCountForApp(state, IDE_TYPE.App),
  );

  const currentWorkspace = useSelector((state: DefaultRootState) => {
    const workspaces = getFetchedWorkspaces(state);

    return workspaces.find((ws) => ws.id === workspaceId);
  });

  // Initialize workspace IDE once when workspaceId changes
  useEffect(() => {
    if (workspaceId && !isWorkspaceEditorInitialized) {
      dispatch(initWorkspaceIDE({ workspaceId }));
    }
  }, [dispatch, workspaceId, isWorkspaceEditorInitialized]);

  // Fetch workspaces if not loaded (same pattern as settings.tsx)
  useEffect(() => {
    if (!currentWorkspace) {
      dispatch(fetchAllWorkspaces({ workspaceId, fetchEntities: true }));
    }
  }, [currentWorkspace, dispatch, workspaceId]);

  // Show loading state while workspace editor is initializing
  if (!isWorkspaceEditorInitialized) {
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
    <PageContainer>
      <IDEContainer>
        <LeftPane>
          <WorkspaceDataSidePane
            dsUsageMap={dsUsageMap}
            workspaceId={workspaceId}
          />
        </LeftPane>
        <MainPane>
          <Switch>
            {/* Create new datasource - use the exact same component */}
            <SentryRoute
              exact
              path="/workspace/:workspaceId/datasources/new"
              render={() => <WorkspaceCreateNewDatasourceTab />}
            />
            {/* Edit existing datasource - use workspace-specific editor */}
            <SentryRoute
              exact
              path="/workspace/:workspaceId/datasources/:datasourceId"
              render={() => <WorkspaceDatasourceEditor />}
            />
            {/* Default list view - show "Connect a datasource" page by default */}
            <SentryRoute
              path="/workspace/:workspaceId/datasources"
              render={() => (
                <WorkspaceCreateNewDatasourceTab workspaceId={workspaceId} />
              )}
            />
          </Switch>
        </MainPane>
      </IDEContainer>
    </PageContainer>
  );
};
