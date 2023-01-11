import { Popover } from "@blueprintjs/core";
import React, { useContext, useEffect, useRef } from "react";
import WidgetSidebar from "pages/Editor/WidgetSidebar";
import { Button } from "design-system";
import { useDispatch, useSelector } from "react-redux";
import { selectForceOpenWidgetPanel } from "../Explorer";
import { forceOpenWidgetPanel } from "actions/widgetSidebarActions";
import { getDragDetails } from "sagas/selectors";
import { AppState } from "@appsmith/reducers";
import { useMouseLocation } from "../GlobalHotKeys/useMouseLocation";
import { getExplorerWidth } from "selectors/explorerSelector";
import { ThemeContext } from "styled-components";

const WIDGET_PANE_WIDTH = 246;
const WIDGET_PANE_HEIGHT = 600;

function WidgetPaneTrigger() {
  const dispatch = useDispatch();
  const theme = useContext(ThemeContext);
  const openWidgetPanel = useSelector(selectForceOpenWidgetPanel);
  const dragDetails = useSelector(getDragDetails);
  const explorerWidth = useSelector(getExplorerWidth);
  const getMousePosition = useMouseLocation();
  const isDragging = useSelector(
    (state: AppState) => state.ui.widgetDragResize.isDragging,
  );
  const toOpen = useRef(false);

  const isOverlappingWithPane = () => {
    const { x, y } = getMousePosition();

    const hbufferOffset = 100 * 2;
    const vbufferOffset = 0 * 1;
    const hOffset = explorerWidth + WIDGET_PANE_WIDTH + hbufferOffset;
    const vOffset =
      parseInt(theme.smallHeaderHeight.slice(0, -2)) +
      40 +
      WIDGET_PANE_HEIGHT +
      vbufferOffset;
    console.log({ x, y, hOffset, vOffset }, "offsets");
    if (x < hOffset && y < vOffset) {
      return true;
    }

    return false;
  };

  useEffect(() => {
    if (isDragging && dragDetails.newWidget) {
      dispatch(forceOpenWidgetPanel(false));
      toOpen.current = true;
    }
  }, [isDragging, dragDetails.newWidget]);

  useEffect(() => {
    if (!isDragging && toOpen.current) {
      if (!isOverlappingWithPane()) {
        dispatch(forceOpenWidgetPanel(true));
      }
      toOpen.current = false;
    }
  }, [isDragging]);

  return (
    <div
      className="widget-pane"
      style={{
        height: "40px",
        width: "40px",
        backgroundColor: "green",
      }}
    >
      <Popover
        canEscapeKeyClose
        content={
          <div
            style={{
              width: "246px",
              height: "600px",
              overflow: "auto",
            }}
          >
            <WidgetSidebar isActive={false} />
          </div>
        }
        isOpen={openWidgetPanel}
        onClose={() => dispatch(forceOpenWidgetPanel(false))}
      >
        <Button
          height={"40"}
          onClick={() => dispatch(forceOpenWidgetPanel(true))}
          tag="button"
          text={"C"}
        />
      </Popover>
    </div>
  );
}

export default WidgetPaneTrigger;
