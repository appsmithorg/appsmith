import { Popover } from "@blueprintjs/core";
import React, { useEffect, useRef } from "react";
import WidgetSidebar from "pages/Editor/WidgetSidebar";
import { Button } from "design-system";
import { useDispatch, useSelector } from "react-redux";
import { selectForceOpenWidgetPanel } from "../Explorer";
import { forceOpenWidgetPanel } from "actions/widgetSidebarActions";
import { getDragDetails } from "sagas/selectors";
import { AppState } from "@appsmith/reducers";

function WidgetPaneTrigger() {
  const dispatch = useDispatch();
  const openWidgetPanel = useSelector(selectForceOpenWidgetPanel);
  const dragDetails = useSelector(getDragDetails);
  const isDragging = useSelector(
    (state: AppState) => state.ui.widgetDragResize.isDragging,
  );
  const toOpen = useRef(false);

  useEffect(() => {
    if (isDragging && dragDetails.newWidget) {
      dispatch(forceOpenWidgetPanel(false));
      toOpen.current = true;
    }
  }, [isDragging, dragDetails.newWidget]);

  useEffect(() => {
    if (!isDragging && toOpen.current) {
      dispatch(forceOpenWidgetPanel(true));
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
