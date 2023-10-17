import React from "react";
import { Switch } from "react-router";
import EditorWrapperBody from "pages/Editor/commons/EditorWrapperBody";
import EditorWrapperContainer from "pages/Editor/commons/EditorWrapperContainer";
import PackageEditorEntityExplorer from "./PackageEditorEntityExplorer";
import BottomBar from "./BottomBar";

function PackageMainContainer() {
  return (
    <>
      <EditorWrapperContainer>
        <PackageEditorEntityExplorer />
        <EditorWrapperBody id="app-body">
          <Switch>
            {/* All subroutes go here */}
            <div />
          </Switch>
        </EditorWrapperBody>
      </EditorWrapperContainer>
      <BottomBar />
    </>
  );
}

export default PackageMainContainer;
