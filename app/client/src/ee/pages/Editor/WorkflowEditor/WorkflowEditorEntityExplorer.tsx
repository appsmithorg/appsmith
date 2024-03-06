import React from "react";
import WorkflowExplorer from "./WorkflowExplorer";
import EntityExplorerSidebar from "components/editorComponents/EntityExplorerSidebar";

function WorkflowEditorEntityExplorer() {
  return (
    <EntityExplorerSidebar>
      {/* Contains entity explorer & widgets library along with a switcher*/}
      <WorkflowExplorer />
    </EntityExplorerSidebar>
  );
}

export default WorkflowEditorEntityExplorer;
