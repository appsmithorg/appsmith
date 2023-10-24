import React from "react";
import { ExplorerWrapper } from "pages/Editor/Explorer/Common/ExplorerWrapper";
import EntityExplorer from "./EntityExplorer";

function ExplorerContent() {
  const activeOption = "explorer";

  return (
    <ExplorerWrapper>
      <EntityExplorer isActive={activeOption === "explorer"} />
    </ExplorerWrapper>
  );
}

export default ExplorerContent;
