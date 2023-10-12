import React from "react";
import { ExplorerWrapper } from "pages/Editor/Explorer/Common/ExplorerWrapper";
import PackageEntityExplorer from "./PackageEntityExplorer";

function PackageExplorerContent() {
  const activeOption = "explorer";

  return (
    <ExplorerWrapper>
      <PackageEntityExplorer isActive={activeOption === "explorer"} />
    </ExplorerWrapper>
  );
}

export default PackageExplorerContent;
