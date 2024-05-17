import { setPropertyPaneWidthAction } from "actions/propertyPaneActions";
import PropertyPaneSidebar from "components/editorComponents/PropertyPaneSidebar";
import React, { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getPropertyPaneWidth } from "selectors/propertyPaneSelectors";
import { CreateNewQueryModal } from "pages/Editor/IDE/RightPane/components/CreateNewQueryModal";
import classNames from "classnames";
import { tailwindLayers } from "../../../../constants/Layers";
import { combinedPreviewModeSelector } from "../../../../selectors/editorSelectors";

/**
 * PropertyPaneWrapper
 *
 * This component is used to wrap the property pane sidebar and create new modal.
 * It is used to handle the width of the property pane sidebar.
 */
function PropertyPaneWrapper() {
  const dispatch = useDispatch();
  const propertyPaneWidth = useSelector(getPropertyPaneWidth);
  const isCombinedPreviewMode = useSelector(combinedPreviewModeSelector);

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
    <div
      className={classNames({
        [`transition-transform transform duration-400 h-full ${tailwindLayers.propertyPane}`]:
          true,
        relative: !isCombinedPreviewMode,
        "translate-x-full fixed right-0": isCombinedPreviewMode,
      })}
    >
      <PropertyPaneSidebar
        onDragEnd={onRightSidebarDragEnd}
        onWidthChange={onRightSidebarWidthChange}
        width={propertyPaneWidth}
      />
      <CreateNewQueryModal />
    </div>
  );
}

export default PropertyPaneWrapper;
