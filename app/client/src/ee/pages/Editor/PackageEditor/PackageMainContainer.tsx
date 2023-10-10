import React from "react";
import { Switch } from "react-router";

import EditorWrapperBody from "pages/Editor/commons/EditorWrapperBody";
import EditorWrapperContainer from "pages/Editor/commons/EditorWrapperContainer";
import PackageEditorEntityExplorer from "./PackageEditorEntityExplorer";

function PackageMainContainer() {
  return (
    <EditorWrapperContainer>
      <PackageEditorEntityExplorer />
      <EditorWrapperBody id="app-body">
        <Switch>
          {/* All subroutes go here */}
          <div />
        </Switch>
      </EditorWrapperBody>
    </EditorWrapperContainer>
  );
}

export default PackageMainContainer;
