import React from "react";
import { Switch, useRouteMatch } from "react-router";
import EditorWrapperBody from "pages/Editor/commons/EditorWrapperBody";
import EditorWrapperContainer from "pages/Editor/commons/EditorWrapperContainer";
import WorkflowEditorEntityExplorer from "./WorkflowEditorEntityExplorer";
import { SentryRoute } from "ce/AppRouter";
import JSEditor from "pages/Editor/JSEditor";
import {
  DATA_SOURCES_EDITOR_ID_PATH,
  INTEGRATION_EDITOR_PATH,
  JS_COLLECTION_EDITOR_PATH,
  JS_COLLECTION_ID_PATH,
  SAAS_EDITOR_API_ID_PATH,
  SAAS_EDITOR_DATASOURCE_ID_PATH,
  WORKFLOW_API_EDITOR_PATH,
  WORKFLOW_QUERY_EDITOR_PATH,
} from "@appsmith/constants/routes/workflowRoutes";
import DatasourceForm from "pages/Editor/SaaSEditor/DatasourceForm";
import DataSourceEditor from "pages/Editor/DataSourceEditor";
import IntegrationEditor from "pages/Editor/IntegrationEditor";
import WorkflowQueryEditor from "./WorkflowQueryEditor";
import WorkflowApiEditor from "./WorkflowApiEditor";
import BottomBar from "components/BottomBar";
import { useSelector } from "react-redux";
import { previewModeSelector } from "selectors/editorSelectors";

function WorkflowMainContainer() {
  const { path } = useRouteMatch();
  const isPreviewMode = useSelector(previewModeSelector);

  // TODO (Workflows): Some of these routes are not implemented yet. Waitng on the backend to be ready.
  return (
    <>
      <EditorWrapperContainer>
        <WorkflowEditorEntityExplorer />
        <EditorWrapperBody id="app-body">
          <Switch>
            <SentryRoute
              component={DataSourceEditor}
              exact
              path={`${path}${DATA_SOURCES_EDITOR_ID_PATH}`}
            />
            <SentryRoute
              component={DatasourceForm}
              exact
              path={`${path}${SAAS_EDITOR_DATASOURCE_ID_PATH}`}
            />
            {/* TO BE IMPLEMENTED */}
            <SentryRoute
              component={JSEditor}
              exact
              path={`${path}${JS_COLLECTION_EDITOR_PATH}`}
            />
            <SentryRoute
              component={JSEditor}
              exact
              path={`${path}${JS_COLLECTION_ID_PATH}`}
            />
            <SentryRoute
              component={WorkflowQueryEditor}
              path={`${path}${WORKFLOW_QUERY_EDITOR_PATH}`}
            />
            <SentryRoute
              component={WorkflowQueryEditor}
              path={`${path}${SAAS_EDITOR_API_ID_PATH}`}
            />
            <SentryRoute
              component={WorkflowApiEditor}
              path={`${path}${WORKFLOW_API_EDITOR_PATH}`}
            />
            <SentryRoute
              component={IntegrationEditor}
              exact
              path={`${path}${INTEGRATION_EDITOR_PATH}`}
            />
          </Switch>
        </EditorWrapperBody>
      </EditorWrapperContainer>
      <BottomBar viewMode={isPreviewMode} />
    </>
  );
}

export default WorkflowMainContainer;
