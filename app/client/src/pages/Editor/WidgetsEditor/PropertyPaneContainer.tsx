import { setPropertyPaneWidthAction } from "actions/propertyPaneActions";
import { AIWindow } from "@appsmith/components/editorComponents/GPT";
import PropertyPaneSidebar from "components/editorComponents/PropertyPaneSidebar";
import React, { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getPropertyPaneWidth } from "selectors/propertyPaneSelectors";

function PropertyPaneContainer() {
  const dispatch = useDispatch();
  const propertyPaneWidth = useSelector(getPropertyPaneWidth);

  /**
   * on property pane sidebar drag end
   *
   * @return void
   */
  const onRightSidebarDragEnd = useCallback(() => {
    dispatch(setPropertyPaneWidthAction(propertyPaneWidth));
  }, [propertyPaneWidth]);

  /**
   * on property pane sidebar width change
   */
  const onRightSidebarWidthChange = useCallback((newWidth) => {
    dispatch(setPropertyPaneWidthAction(newWidth));
  }, []);

  return (
    <AIWindow enableOutsideClick windowType="popover">
      <PropertyPaneSidebar
        onDragEnd={onRightSidebarDragEnd}
        onWidthChange={onRightSidebarWidthChange}
        width={propertyPaneWidth}
      />
    </AIWindow>
  );
}

export default PropertyPaneContainer;
