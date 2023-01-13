import { Position } from "@blueprintjs/core";
import React, { useEffect, useRef } from "react";
import WidgetSidebar from "pages/Editor/WidgetSidebar";
import { useDispatch, useSelector } from "react-redux";
import { selectForceOpenWidgetPanel } from "../Explorer";
import { forceOpenWidgetPanel } from "actions/widgetSidebarActions";
import { getDragDetails } from "sagas/selectors";
import { AppState } from "@appsmith/reducers";
import { useMouseLocation } from "../GlobalHotKeys/useMouseLocation";
import styled from "styled-components";
import { Icon, IconSize } from "design-system";
import { Popover2 } from "@blueprintjs/popover2";

const WIDGET_PANE_WIDTH = 246;
const WIDGET_PANE_HEIGHT = 600;

const StyledTrigger = styled.div`
  height: 40px;
  width: 36px;

  :hover {
    background-color: #f1f1f1;
  }
  :active {
    background-color: #e7e7e7;
  }

  cursor: pointer;
`;

function WidgetPaneTrigger() {
  const dispatch = useDispatch();
  const openWidgetPanel = useSelector(selectForceOpenWidgetPanel);
  const dragDetails = useSelector(getDragDetails);
  const getMousePosition = useMouseLocation();
  const ref = useRef<HTMLDivElement | null>(null);
  const isDragging = useSelector(
    (state: AppState) => state.ui.widgetDragResize.isDragging,
  );
  const toOpen = useRef(false);

  const isOverlappingWithPane = () => {
    const { x, y } = getMousePosition();
    let ctaPosition = { left: 0, top: 0 };

    if (ref.current) {
      ctaPosition = ref.current.getBoundingClientRect();
    }

    const hbufferOffset = 200;
    const hOffset = ctaPosition.left + hbufferOffset + WIDGET_PANE_WIDTH;
    const vOffset = ctaPosition.top + WIDGET_PANE_HEIGHT;

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
    <div className="widget-pane">
      <Popover2
        canEscapeKeyClose
        content={
          <div
            style={{
              display: "flex",
              width: "246px",
              height: "600px",
            }}
          >
            <WidgetSidebar isActive={false} />
          </div>
        }
        isOpen={openWidgetPanel}
        minimal
        onClose={() => dispatch(forceOpenWidgetPanel(false))}
        position={Position.BOTTOM_LEFT}
      >
        <StyledTrigger
          className="flex ml-3 justify-center"
          onClick={() => dispatch(forceOpenWidgetPanel(true))}
          ref={ref}
        >
          <Icon fillColor={"#575757"} name="plus" size={IconSize.XXL} />
          <Icon
            fillColor={"#858282"}
            name="arrow-down-s-fill"
            size={IconSize.XXS}
          />
        </StyledTrigger>
      </Popover2>
    </div>
  );
}

export default WidgetPaneTrigger;
