import { updateExplorerWidthAction } from "actions/explorerActions";
import PropertyPaneSidebar from "components/editorComponents/PropertyPaneSidebar";
import { DEFAULT_PROPERTY_PANE_WIDTH } from "constants/AppConstants";
import React, { useCallback } from "react";
import { useDispatch } from "react-redux";
import WidgetsEditor from "./WidgetsEditor";

function EditorContainer() {
  const dispatch = useDispatch();

  const [propertyPaneWidth, setPropertyPaneWidth] = React.useState(
    DEFAULT_PROPERTY_PANE_WIDTH,
  );
  /**
   * on property pane sidebar drag end
   *
   * @return void
   */
  const onRightSidebarDragEnd = useCallback(() => {
    dispatch(updateExplorerWidthAction(propertyPaneWidth));
  }, [propertyPaneWidth]);

  /**
   * on property pane sidebar width change
   */
  const onRightSidebarWidthChange = useCallback((newWidth) => {
    setPropertyPaneWidth(newWidth);
  }, []);

  return (
    <div className="relative overflow-hidden flex flex-row w-full">
      <WidgetsEditor />
      <PropertyPaneSidebar
        onDragEnd={onRightSidebarDragEnd}
        onWidthChange={onRightSidebarWidthChange}
        width={propertyPaneWidth}
      />
    </div>
  );
}

export default EditorContainer;
