import { setPropertyPaneWidthAction } from "actions/propertyPaneActions";
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
    <PropertyPaneSidebar
      onDragEnd={onRightSidebarDragEnd}
      onWidthChange={onRightSidebarWidthChange}
      width={propertyPaneWidth}
    />
  );
}

export default PropertyPaneContainer;
