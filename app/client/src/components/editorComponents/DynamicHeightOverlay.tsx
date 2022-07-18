import { focusWidget } from "actions/widgetActions";
import React, { memo, useEffect, useMemo, useRef } from "react";
import { useState } from "react";
import { useSelector } from "react-redux";
import { useDrag } from "react-use-gesture";
import { AppState } from "reducers";
import { getCanvasWidgets } from "selectors/entitiesSelector";
import styled from "styled-components";
import EventEmitter from "utils/EventEmitter";
import {
  useShowPropertyPane,
  useShowTableFilterPane,
  useWidgetDragResize,
} from "utils/hooks/dragResizeHooks";
import { getParentToOpenIfAny } from "utils/hooks/useClickToSelectWidget";
import { useWidgetSelection } from "utils/hooks/useWidgetSelection";
import { WidgetProps } from "widgets/BaseWidget";

const StyledDynamicHeightOverlay = styled.div`
  width: 100%;
  height: 100%;
  position: relative;
`;

const OVERLAY_COLOR = "#F32B8B";

interface OverlayDisplayProps {
  isActive: boolean;
  maxY: number;
}

const OverlayDisplay = styled.div<OverlayDisplayProps>`
  display: ${(props) => (props.isActive ? "block" : "none")};
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: ${(props) => props.maxY}px;
  // border-bottom: 1px solid ${OVERLAY_COLOR};
  background-color: rgba(243, 43, 139, 0.1);
`;

interface MinMaxHeightProps {
  maxDynamicHeight: number;
  minDynamicHeight: number;
}

interface DynamicHeightOverlayProps extends MinMaxHeightProps, WidgetProps {
  onMaxHeightSet: (height: number) => void;
  onMinHeightSet: (height: number) => void;
}

const OverlayHandleLabelSlider = styled.div`
  position: absolute;
  right: 0;
  transform: translateX(calc(100% + 16px));
  padding: 1px 4px;
  background: #191919;
  font-weight: 400;
  font-size: 10px;
  line-height: 16px;
  color: #ffffff;
  text-align: center;
  white-space: nowrap;
`;

const Bordered = styled.div<{ y: number }>`
  pointer-events: none;
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  transform: translateY(${(props) => props.y}px);

  &:after {
    position: absolute;
    content: "";
    width: 100%;
    height: 2px;
    border-bottom: 1px dashed ${OVERLAY_COLOR};
  }
`;

const OverlayLabels: React.FC<{
  isActive: boolean;
  minRows: number;
  maxRows: number;
}> = ({ isActive, maxRows, minRows }) => {
  return (
    <div style={{ display: isActive ? "block" : "none" }}>
      <Bordered y={minRows * 10}>
        <OverlayHandleLabelSlider>
          Min-height: {minRows} rows
        </OverlayHandleLabelSlider>
      </Bordered>
      <Bordered y={maxRows * 10}>
        <OverlayHandleLabelSlider>
          Max-height: {maxRows} rows
        </OverlayHandleLabelSlider>
      </Bordered>
    </div>
  );
};

const DynamicHeightOverlay: React.FC<DynamicHeightOverlayProps> = memo(
  ({
    children,
    maxDynamicHeight,
    minDynamicHeight,
    onMaxHeightSet,
    onMinHeightSet,
    ...props
  }) => {
    const widgetId = props.widgetId;
    const selectedWidget = useSelector(
      (state: AppState) => state.ui.widgetDragResize.lastSelectedWidget,
    );

    const { setIsResizing } = useWidgetDragResize();
    const isResizing = useSelector(
      (state: AppState) => state.ui.widgetDragResize.isResizing,
    );

    function onPropertPaneFocusedFocusedHandler(propertyName: string) {
      if (propertyName === "maxDynamicHeight") {
        setIsResizing && !isResizing && setIsResizing(true);
      }

      if (propertyName === "minDynamicHeight") {
        setIsResizing && !isResizing && setIsResizing(true);
      }
    }

    function onPropertFieldBlurredHandler(propertyName: string) {
      if (propertyName === "maxDynamicHeight") {
        setIsResizing && setIsResizing(false);
      }

      if (propertyName === "minDynamicHeight") {
        setIsResizing && setIsResizing(false);
      }
    }

    useEffect(() => {
      EventEmitter.add(
        "property_pane_input_focused",
        onPropertPaneFocusedFocusedHandler,
      );
      EventEmitter.add(
        "property_pane_input_blurred",
        onPropertFieldBlurredHandler,
      );

      return () => {
        EventEmitter.remove(
          "property_pane_input_focused",
          onPropertPaneFocusedFocusedHandler,
        );
        EventEmitter.remove(
          "property_pane_input_blurred",
          onPropertFieldBlurredHandler,
        );
      };
    }, []);

    const isWidgetSelected = selectedWidget === widgetId;

    return (
      <StyledDynamicHeightOverlay>
        <OverlayDisplay
          isActive={isWidgetSelected}
          maxY={maxDynamicHeight * 10}
        />
        <OverlayLabels
          isActive={isWidgetSelected}
          maxRows={maxDynamicHeight}
          minRows={minDynamicHeight}
        />
        {children}
      </StyledDynamicHeightOverlay>
    );
  },
);

DynamicHeightOverlay.displayName = "DynamicHeightOverlay";

export default DynamicHeightOverlay;
