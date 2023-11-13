import React from "react";

import EntityExplorerSidebar from "components/editorComponents/EntityExplorerSidebar";
import Modules from "../../PackageExplorer/Modules";
import Explorer from "../../PackageExplorer";

function PackageEditorEntityExplorer() {
  return (
    <EntityExplorerSidebar>
      <Modules />
      <Explorer />
    </EntityExplorerSidebar>
  );
}

export default PackageEditorEntityExplorer;
