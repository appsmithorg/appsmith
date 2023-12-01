import React from "react";
import EditorWrapperContainer from "pages/Editor/commons/EditorWrapperContainer";
import PackageEditorEntityExplorer from "./PackageEditorEntityExplorer";

function PackageMainContainer() {
  return (
    <EditorWrapperContainer>
      <PackageEditorEntityExplorer />
    </EditorWrapperContainer>
  );
}

export default PackageMainContainer;
