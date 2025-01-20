import React from "react";
import { ResizableComponent } from "layoutSystems/common/resizer/ResizableComponent";
import { useDispatch, useSelector } from "react-redux";
import { getPropertyPaneWidth } from "selectors/propertyPaneSelectors";
import { setPropertyPaneWidthAction } from "actions/propertyPaneActions";
import { DEFAULT_PROPERTY_PANE_WIDTH } from "constants/AppConstants";
import type { WidgetProps } from "widgets/BaseWidget";
import { RenderModes } from "constants/WidgetConstants";
import { ResponsiveBehavior, FlexVerticalAlignment } from "layoutSystems/common/utils/constants";

interface RightPaneResizeWrapperProps {
  children: React.ReactNode;
}

export function RightPaneResizeWrapper({ children }: RightPaneResizeWrapperProps) {
  // Required widget props for ResizableComponent
  const widgetProps: WidgetProps = {
    widgetId: "propertyPane",
    type: "PROPERTY_PANE",
    widgetName: "PropertyPane",
    renderMode: RenderModes.CANVAS,
    version: 1,
    parentColumnSpace: 1,
    parentRowSpace: 1,
    leftColumn: 0,
    rightColumn: 1,
    topRow: 0,
    bottomRow: 1,
    isLoading: false,
    parentId: "",
    widgetAnnotation: { show: false },
    resizeDisabled: false,
    disablePropertyPane: false,
    isDynamicHeight: false,
    minDynamicHeight: 0,
    dynamicHeight: "FIXED",
    isCanvas: false,
    detachFromLayout: false,
    isVisible: true,
    isDisabled: false,
    isMobile: false,
    mobileTopRow: 0,
    mobileBottomRow: 0,
    mobileLeftColumn: 0,
    mobileRightColumn: 0,
    responsiveBehavior: ResponsiveBehavior.Fill,
    positioning: "fixed",
    mobileDisabledResizeHandles: [],
    disabledResizeHandles: [],
    canExtend: false,
    isFlexChild: false,
    flexVerticalAlignment: FlexVerticalAlignment.Center,
    flexHorizontalAlignment: "stretch"
  };
  const dispatch = useDispatch();
  const paneWidth = useSelector(getPropertyPaneWidth);

  const updateSize = (newDimensions: { width: number }) => {
    // Enforce minimum width of 200px
    const newWidth = Math.max(newDimensions.width, 200);
    dispatch(setPropertyPaneWidthAction(newWidth));
  };

  return (
    <ResizableComponent
      {...widgetProps}
      paddingOffset={0}
      disabledResizeHandles={["right", "top", "bottom"]}
      dimensions={{
        width: paneWidth,
        height: window.innerHeight // Full height, controlled by grid
      }}
      onResizeStop={updateSize}
      enableHorizontalResize={true}
      enableVerticalResize={false}
      handles={{
        left: true,
        right: false,
        top: false,
        bottom: false,
        bottomRight: false,
        bottomLeft: false,
        topRight: false,
        topLeft: false
      }}
      snapGrid={{ x: 1, y: 1 }}
      originalPositions={{
        id: "propertyPane",
        left: 0,
        top: 0,
        bottom: window.innerHeight,
        right: paneWidth
      }}
      gridProps={{
        parentColumnSpace: 1,
        parentRowSpace: 1,
        maxGridColumns: 1,
        paddingOffset: 0
      }}
    >
      {children}
    </ResizableComponent>
  );
}
