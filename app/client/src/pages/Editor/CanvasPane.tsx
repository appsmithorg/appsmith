import React from "react";
import WidgetsEditor from "pages/Editor/WidgetsEditor";
import { useSelector } from "react-redux";
import { getPropertyPaneWidth } from "selectors/propertyPaneSelectors";
import { getPaneCount, getTabsPaneWidth } from "selectors/multiPaneSelectors";
import { SIDE_NAV_WIDTH } from "pages/common/SideNav";
import { PaneLayoutOptions } from "reducers/uiReducers/multiPaneReducer";

const CanvasPane = () => {
  const propertyPaneWidth = useSelector(getPropertyPaneWidth);
  const paneCount = useSelector(getPaneCount);
  const tabPaneWidth = useSelector(getTabsPaneWidth);
  const screenWidth = window.screen.width;
  let width = screenWidth - tabPaneWidth - SIDE_NAV_WIDTH;
  if (paneCount === PaneLayoutOptions.THREE_PANE) {
    width -= propertyPaneWidth;
  }
  return (
    <div className="ml-5" style={{ width: width.toFixed(0) + "px" }}>
      <WidgetsEditor />
    </div>
  );
};

export default CanvasPane;
