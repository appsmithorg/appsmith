import React from "react";
import PropertyPaneSidebar from "components/editorComponents/PropertyPaneSidebar";
import { CreateNewQueryModal } from "pages/Editor/IDE/RightPane/components/CreateNewQueryModal";
import { PropertyPaneResizableHandle } from "./PropertyPaneResizableHandle";

/**
 * PropertyPaneWrapper
 *
 * This component is used to wrap the property pane sidebar and create new modal.
 * It is used to handle the width of the property pane sidebar.
 */
function PropertyPaneWrapper() {
  return (
    <>
      <PropertyPaneResizableHandle>
        <PropertyPaneSidebar />
      </PropertyPaneResizableHandle>
      <CreateNewQueryModal />
    </>
  );
}

export default PropertyPaneWrapper;
