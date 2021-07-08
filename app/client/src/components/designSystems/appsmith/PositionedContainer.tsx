import React, { CSSProperties, ReactNode, useCallback, useMemo } from "react";
import { BaseStyle } from "widgets/BaseWidget";
import { WIDGET_PADDING } from "constants/WidgetConstants";
import { generateClassName } from "utils/generators";
import styled from "styled-components";
import { useClickOpenPropPane } from "utils/hooks/useClickOpenPropPane";
import { stopEventPropagation } from "utils/AppsmithUtils";
import { Layers } from "constants/Layers";
import { useDispatch, useSelector } from "react-redux";
import { snipingModeSelector } from "../../../selectors/commentsSelectors";
import { setSnipingMode as setSnipingModeAction } from "../../../actions/commentActions";
import { Colors } from "constants/Colors";

const PositionedWidget = styled.div`
  &:hover {
    z-index: ${Layers.positionedWidget + 1} !important;
  }

  .sniping-cover {
    width: 100%;
    height: 100%;
    transition: 0.15s ease;
    opacity: 0;
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    -ms-transform: translate(-50%, -50%);
    text-align: center;
    background-color: ${Colors.DANUBE};
  }

  &:hover .sniping-cover {
    opacity: 0.3;
    cursor: pointer;
  }
`;
type PositionedContainerProps = {
  style: BaseStyle;
  children: ReactNode;
  widgetId: string;
  widgetType: string;
  selected?: boolean;
  focused?: boolean;
  resizeDisabled?: boolean;
};

export function PositionedContainer(props: PositionedContainerProps) {
  const isSnipingMode = useSelector(snipingModeSelector);
  const dispatch = useDispatch();
  const x = props.style.xPosition + (props.style.xPositionUnit || "px");
  const y = props.style.yPosition + (props.style.yPositionUnit || "px");
  const padding = WIDGET_PADDING;
  const openPropertyPane = useClickOpenPropPane();
  // memoized classname
  const containerClassName = useMemo(() => {
    return (
      generateClassName(props.widgetId) +
      " positioned-widget " +
      `t--widget-${props.widgetType
        .split("_")
        .join("")
        .toLowerCase()}`
    );
  }, [props.widgetType, props.widgetId]);
  const containerStyle: CSSProperties = useMemo(() => {
    return {
      position: "absolute",
      left: x,
      top: y,
      height: props.style.componentHeight + (props.style.heightUnit || "px"),
      width: props.style.componentWidth + (props.style.widthUnit || "px"),
      padding: padding + "px",
      zIndex:
        props.selected || props.focused
          ? Layers.selectedWidget
          : Layers.positionedWidget,
      backgroundColor: "inherit",
    };
  }, [props.style]);

  const openPropPane = useCallback(
    (e) => {
      console.log("This is the sniping mode!");
      openPropertyPane(e, props.widgetId);
      if (isSnipingMode) {
        dispatch(setSnipingModeAction(false));
      }
    },
    [props.widgetId, openPropertyPane, isSnipingMode],
  );

  return (
    <PositionedWidget
      className={containerClassName}
      data-testid="test-widget"
      id={props.widgetId}
      key={`positioned-container-${props.widgetId}`}
      onClick={stopEventPropagation}
      // Positioned Widget is the top enclosure for all widgets and clicks on/inside the widget should not be propogated/bubbled out of this Container.
      onClickCapture={openPropPane}
      //Before you remove: This is used by property pane to reference the element
      style={containerStyle}
    >
      {props.children}
      {isSnipingMode && (
        <div className="sniping-cover" onClick={openPropPane} />
      )}
    </PositionedWidget>
  );
}

PositionedContainer.padding = WIDGET_PADDING;

export default PositionedContainer;
