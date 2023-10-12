import React from "react";

import { EntityExplorerSidebar } from "components/editorComponents/Sidebar";
import Modules from "../../PackageExplorer/Modules";
import PackageExplorer from "../../PackageExplorer";

function PackageEditorEntityExplorer() {
  return (
    <EntityExplorerSidebar>
      <Modules />
      <PackageExplorer />
    </EntityExplorerSidebar>
  );
}

export default PackageEditorEntityExplorer;
