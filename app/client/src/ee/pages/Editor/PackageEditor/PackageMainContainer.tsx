import React from "react";
import { Switch } from "react-router";
import EditorWrapperBody from "pages/Editor/commons/EditorWrapperBody";
import EditorWrapperContainer from "pages/Editor/commons/EditorWrapperContainer";
import PackageEditorEntityExplorer from "./PackageEditorEntityExplorer";
import ModuleEditor from "../ModuleEditor";
import {
  MODULE_EDITOR_PATH,
  PACKAGE_EDITOR_PATH,
  SAAS_EDITOR_DATASOURCE_ID_PATH,
} from "@appsmith/constants/routes/packageRoutes";
import { SentryRoute } from "@appsmith/AppRouter";
import BottomBar from "./BottomBar";
import IntegrationEditor from "pages/Editor/IntegrationEditor";
import DataSourceEditor from "pages/Editor/DataSourceEditor";
import DatasourceForm from "pages/Editor/SaaSEditor/DatasourceForm";
import {
  DATA_SOURCES_EDITOR_ID_PATH,
  INTEGRATION_EDITOR_PATH,
} from "constants/routes";

function PackageMainContainer() {
  return (
    <>
      <EditorWrapperContainer>
        <PackageEditorEntityExplorer />
        <EditorWrapperBody id="app-body">
          <Switch>
            {/* All subroutes go here */}
            <SentryRoute component={ModuleEditor} path={MODULE_EDITOR_PATH} />
            <SentryRoute
              component={IntegrationEditor}
              exact
              path={`${PACKAGE_EDITOR_PATH}${INTEGRATION_EDITOR_PATH}`}
            />
            <SentryRoute
              component={DataSourceEditor}
              exact
              path={`${PACKAGE_EDITOR_PATH}${DATA_SOURCES_EDITOR_ID_PATH}`}
            />
            <SentryRoute
              component={DatasourceForm}
              exact
              path={`${PACKAGE_EDITOR_PATH}${SAAS_EDITOR_DATASOURCE_ID_PATH}`}
            />
          </Switch>
        </EditorWrapperBody>
      </EditorWrapperContainer>
      <BottomBar />
    </>
  );
}

export default PackageMainContainer;
