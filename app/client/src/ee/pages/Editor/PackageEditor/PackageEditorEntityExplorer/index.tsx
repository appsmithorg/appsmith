import React from "react";

import EntityExplorerSidebar from "components/editorComponents/EntityExplorerSidebar";
import Modules from "../../PackageExplorer/Modules";

function PackageEditorEntityExplorer() {
  return (
    <EntityExplorerSidebar>
      <Modules />
    </EntityExplorerSidebar>
  );
}

export default PackageEditorEntityExplorer;
