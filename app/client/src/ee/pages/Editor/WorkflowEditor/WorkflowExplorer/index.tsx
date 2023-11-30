import React from "react";
import { ExplorerWrapper } from "pages/Editor/Explorer/Common/ExplorerWrapper";
import WorkflowEntityExplorer from "./WorkflowEntityExplorer";

function WorkflowExplorerContent() {
  const activeOption = "explorer";

  return (
    <ExplorerWrapper>
      <WorkflowEntityExplorer isActive={activeOption === "explorer"} />
    </ExplorerWrapper>
  );
}

export default WorkflowExplorerContent;
