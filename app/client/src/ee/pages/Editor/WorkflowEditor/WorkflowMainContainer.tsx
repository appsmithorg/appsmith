import React from "react";
import EditorWrapperContainer from "pages/Editor/commons/EditorWrapperContainer";
import WorkflowEditorEntityExplorer from "./WorkflowEditorEntityExplorer";

function WorkflowMainContainer() {
  return (
    <EditorWrapperContainer>
      <WorkflowEditorEntityExplorer />
    </EditorWrapperContainer>
  );
}

export default WorkflowMainContainer;
