import type { CSSProperties } from "react";
import React, { useCallback, useMemo } from "react";
import styled from "styled-components";

import { WIDGET_PADDING } from "constants/WidgetConstants";
import { useSelector } from "react-redux";
import { snipingModeSelector } from "selectors/editorSelectors";
import { getIsResizing } from "selectors/widgetSelectors";
import { useClickToSelectWidget } from "utils/hooks/useClickToSelectWidget";
import { usePositionedContainerZIndex } from "utils/hooks/usePositionedContainerZIndex";
import { widgetTypeClassname } from "widgets/WidgetUtils";
import { RESIZE_BORDER_BUFFER } from "layoutSystems/common/resizer/common";
import { checkIsDropTarget } from "WidgetProvider/factory/helpers";
import type { FlexComponentProps } from "../../autolayout/utils/types";
import { useHoverToFocusWidget } from "utils/hooks/useHoverToFocusWidget";
import { selectCombinedPreviewMode } from "selectors/gitModSelectors";

const FlexWidget = styled.div`
  position: relative;
`;

export function FlexComponent(props: FlexComponentProps) {
  const isSnipingMode = useSelector(snipingModeSelector);
  const [handleMouseOver, handleMouseLeave] = useHoverToFocusWidget(
    props.widgetId,
    props.isResizeDisabled,
  );
  const clickToSelectWidget = useClickToSelectWidget(props.widgetId);
  const onClickFn = useCallback(
    (e) => {
      clickToSelectWidget(e);
    },
    [props.widgetId, clickToSelectWidget],
  );

  const isDropTarget = checkIsDropTarget(props.widgetType);
  const { onHoverZIndex, zIndex } = usePositionedContainerZIndex(
    isDropTarget,
    props.widgetId,
    props.focused,
    props.selected,
  );

  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const stopEventPropagation = (e: any) => {
    !isSnipingMode && e.stopPropagation();
  };

  const className = useMemo(
    () =>
      `auto-layout-parent-${props.parentId} auto-layout-child-${
        props.widgetId
      } ${widgetTypeClassname(
        props.widgetType,
      )} t--widget-${props.widgetName.toLowerCase()}`,
    [props.parentId, props.widgetId, props.widgetType, props.widgetName],
  );
  const isPreviewMode = useSelector(selectCombinedPreviewMode);

  const isResizing = useSelector(getIsResizing);
  const widgetDimensionsViewCss = {
    width: props.componentWidth - WIDGET_PADDING * 2,
    height: props.componentHeight - WIDGET_PADDING * 2,
    margin: WIDGET_PADDING + "px",
    transform: `translate3d(${
      props.alignment === "end" ? "-" : ""
    }${WIDGET_PADDING}px, ${WIDGET_PADDING}px, 0px)`,
  };
  const widgetDimensionsEditCss = {
    width:
      isResizing && !props.isResizeDisabled
        ? "auto"
        : `${
            props.componentWidth - WIDGET_PADDING * 2 + RESIZE_BORDER_BUFFER
          }px`,
    height:
      isResizing && !props.isResizeDisabled
        ? "auto"
        : `${
            props.componentHeight - WIDGET_PADDING * 2 + RESIZE_BORDER_BUFFER
          }px`,
    margin: WIDGET_PADDING / 2 + "px",
  };
  const flexComponentStyle: CSSProperties = useMemo(() => {
    return {
      display: "flex",
      zIndex,
      ...(props.renderMode === "PAGE"
        ? widgetDimensionsViewCss
        : widgetDimensionsEditCss),
      minHeight: "30px",
      alignSelf: props.flexVerticalAlignment,
      "&:hover": {
        zIndex: onHoverZIndex + " !important",
      },
    };
  }, [
    props.isMobile,
    props.componentWidth,
    props.componentHeight,
    props.flexVerticalAlignment,
    zIndex,
    isResizing,
    isPreviewMode,
    onHoverZIndex,
  ]);

  return (
    <FlexWidget
      className={className}
      data-testid="test-widget"
      data-widgetname-cy={props.widgetName}
      id={"auto_" + props.widgetId}
      onClick={stopEventPropagation}
      onClickCapture={onClickFn}
      onMouseLeave={handleMouseLeave}
      onMouseOver={handleMouseOver}
      style={flexComponentStyle}
    >
      {props.children}
    </FlexWidget>
  );
}

export default FlexComponent;
