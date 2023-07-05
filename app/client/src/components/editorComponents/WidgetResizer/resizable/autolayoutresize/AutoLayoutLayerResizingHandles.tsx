import type { AppState } from "@appsmith/reducers";
import { Colors } from "constants/Colors";
import { APP_MODE } from "entities/App";
import React, { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { getWidgets } from "sagas/selectors";
import {
  getIsAutoLayoutMobileBreakPoint,
  previewModeSelector,
} from "selectors/editorSelectors";
import { getAppMode } from "selectors/entitiesSelector";
import styled from "styled-components";
import type { FlexLayer } from "utils/autoLayout/autoLayoutTypes";
import { ResponsiveBehavior } from "utils/autoLayout/constants";
import type { FlattenedWidgetProps } from "widgets/constants";
import { useDrag } from "@use-gesture/react";
import { getAutoLayoutCanvasMetaWidth } from "selectors/autoLayoutSelectors";
import { MAIN_CONTAINER_WIDGET_ID } from "constants/WidgetConstants";
import { calculateLayerMinWidth } from "utils/autoLayout/AutoLayoutUtils";

const LayerResizeHandle = styled.div`
  position: absolute;
  background-color: ${Colors.WATUSI};
  width: 3px;
  z-index: 4;
  cursor: col-resize;
`;
interface FillWidgetResizerConfig {
  leftWidget?: string;
  rightWidget?: string;
  widget: FlattenedWidgetProps;
  // position: {
  //   left: number;
  //   top: number;
  //   height: number;
  //   width: number;
  // };
}

interface FillWidgetResizerProps extends FillWidgetResizerConfig {
  layerIndex: number;
  layerMinWidth: number;
}

const FillWidgetResizer = ({
  layerIndex,
  layerMinWidth,
  // leftWidget,
  // rightWidget,
  widget,
}: FillWidgetResizerProps) => {
  const [movement, setHorizontalMovement] = useState(0);
  const parentId = widget.parentId || MAIN_CONTAINER_WIDGET_ID;
  const parentWidth = useSelector((state) =>
    getAutoLayoutCanvasMetaWidth(state, parentId),
  );
  const layerId = `auto_Layer_${parentId}_${layerIndex}`;
  const widgetPositions = useSelector(
    (state: AppState) => state.entities.widgetPositions,
  );
  const [currentPosition, setCurrentPosition] = useState(
    widgetPositions[widget.widgetId],
  );
  useEffect(() => {
    if (movement === 0) {
      setCurrentPosition(widgetPositions[widget.widgetId]);
    }
  }, [widgetPositions, movement]);
  const currentGrowFactor = currentPosition.width / parentWidth;
  const domUpdateWidgets = () => {
    const { widgetId } = widget;
    const widgetAutoLayoutElement = document.getElementById(
      `auto_widget_${widgetId}`,
    );
    if (widgetAutoLayoutElement) {
      widgetAutoLayoutElement.style.flexBasis = `${
        (currentGrowFactor + movement / parentWidth) * 100
      }%`;
      widgetAutoLayoutElement.style.flexGrow = "0";
    }
  };
  const setLayerWrapStyles = (stopWrapping: boolean) => {
    const layerElemet = document.getElementById(layerId);
    if (layerElemet) {
      if (stopWrapping) {
        layerElemet.style.flexWrap = "nowrap";
      } else {
        layerElemet.style.flexWrap = "wrap";
      }
    }
  };
  const updateWidgets = () => {
    if (movement !== 0) {
    }
  };
  const bind = useDrag((state) => {
    const {
      first,
      last,
      dragging,
      event,
      // memo,
      movement: [mx],
    } = state;
    if (first) {
      // to stop executing other drags
      event && event.preventDefault();
      setLayerWrapStyles(true);
    }
    if (dragging) {
      if (currentPosition.width + mx <= parentWidth - layerMinWidth) {
        setHorizontalMovement(mx);
        domUpdateWidgets();
      }
    }
    if (last) {
      updateWidgets();
      setLayerWrapStyles(false);
      setHorizontalMovement(0);
    }
  });

  // const widthChange = (newDimensions.width * 100) / parentWidth;
  // const newlyComputedWidth = Math.min(
  //   Math.max(componentWidth + widthChange, minWidthPercentage),
  //   100,
  // );
  // //ToDo: Ashok need to add check to update widgets only when needed
  // onStop({
  //   width: newlyComputedWidth,
  //   height: newDimensions.height,
  // });
  return (
    <LayerResizeHandle
      {...bind()}
      style={{
        top: `${currentPosition.top}px`,
        left: `${currentPosition.left + currentPosition.width + movement}px`,
        height: `${currentPosition.height}px`,
      }}
    />
  );
};

export const AutoLayoutLayerResizingHandles = ({
  children,
  layer,
  layerIndex,
  widgetId,
}: any) => {
  const allWidgets = useSelector(getWidgets);
  const isAutoCanvasResizing = useSelector(
    (state: AppState) => state.ui.widgetDragResize.isAutoCanvasResizing,
  );
  const appMode = useSelector(getAppMode);
  const isPreviewMode = useSelector(previewModeSelector);
  const showResizers = appMode === APP_MODE.EDIT && !isPreviewMode;
  const parentId = allWidgets[widgetId].parentId || MAIN_CONTAINER_WIDGET_ID;
  const parentWidth = useSelector((state) =>
    getAutoLayoutCanvasMetaWidth(state, parentId),
  );
  const widgetPositions = useSelector(
    (state: AppState) => state.entities.widgetPositions,
  );
  const mainCanvasWidth = useSelector((state) =>
    getAutoLayoutCanvasMetaWidth(state, MAIN_CONTAINER_WIDGET_ID),
  );
  const isMobile = useSelector(getIsAutoLayoutMobileBreakPoint);
  const layerMinWidth = calculateLayerMinWidth(
    layer,
    allWidgets,
    isMobile,
    parentWidth,
    mainCanvasWidth,
  );
  const fillWidgetsOrderConfig = useMemo(() => {
    const fillWidgetsOrder: FillWidgetResizerConfig[] = [];
    if (
      Object.keys(widgetPositions).length > 0 &&
      !isAutoCanvasResizing &&
      showResizers
    ) {
      (layer as FlexLayer).children.forEach((each, index) => {
        const { id } = each;
        const eachWidget = allWidgets[id];
        let leftWidget, rightWidget;
        if (
          eachWidget &&
          eachWidget.responsiveBehavior === ResponsiveBehavior.Fill
        ) {
          if (index > 0) {
            leftWidget = layer.children[index - 1];
          } else if (index < layer.children.length) {
            rightWidget = layer.children[index + 1];
          }
          fillWidgetsOrder.push({
            leftWidget,
            widget: eachWidget,
            rightWidget,
          });
        }
      });
    }
    return fillWidgetsOrder;
  }, [allWidgets, layer, isAutoCanvasResizing, showResizers, widgetPositions]);

  return showResizers ? (
    <>
      {fillWidgetsOrderConfig.map((each: any, index: any) => {
        return (
          <FillWidgetResizer
            key={index}
            {...{ ...each, layer, layerIndex, layerMinWidth }}
          />
        );
      })}
      {children}
    </>
  ) : (
    children
  );
};
