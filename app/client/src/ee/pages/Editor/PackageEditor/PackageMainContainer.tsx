import React from "react";
import { Switch } from "react-router";
import EditorWrapperBody from "pages/Editor/commons/EditorWrapperBody";
import EditorWrapperContainer from "pages/Editor/commons/EditorWrapperContainer";
import PackageEditorEntityExplorer from "./PackageEditorEntityExplorer";
import ModuleEditor from "../ModuleEditor";
import { MODULE_EDITOR_PATH } from "@appsmith/constants/routes/packageRoutes";
import { SentryRoute } from "@appsmith/AppRouter";
import BottomBar from "./BottomBar";

function PackageMainContainer() {
  return (
    <>
      <EditorWrapperContainer>
        <PackageEditorEntityExplorer />
        <EditorWrapperBody id="app-body">
          <Switch>
            {/* All subroutes go here */}
            <SentryRoute component={ModuleEditor} path={MODULE_EDITOR_PATH} />
          </Switch>
        </EditorWrapperBody>
      </EditorWrapperContainer>
      <BottomBar />
    </>
  );
}

export default PackageMainContainer;
