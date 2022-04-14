import React, { useCallback } from "react";
import styled from "styled-components";
import { WidgetProps } from "widgets/BaseWidget";
import { WIDGET_PADDING } from "constants/WidgetConstants";
import { useDispatch, useSelector } from "react-redux";
import { AppState } from "reducers";
import { getColorWithOpacity } from "constants/DefaultTheme";
// import AnalyticsUtil from "utils/AnalyticsUtil";
import { snipingModeSelector } from "selectors/editorSelectors";
import { useWidgetSelection } from "utils/hooks/useWidgetSelection";
import { Layers } from "constants/Layers";
import { bindDataToWidget } from "actions/propertyPaneActions";

const SnipeableWrapper = styled.div<{ isFocused: boolean }>`
  position: absolute;
  width: calc(100% + ${WIDGET_PADDING - 5}px);
  height: calc(100% + ${WIDGET_PADDING - 5}px);
  transition: 0.15s ease;
  text-align: center;
  border: 3px solid transparent;

  &:hover {
    border: 3px solid
      ${(props) =>
        props.isFocused
          ? getColorWithOpacity(props.theme.colors.textAnchor, 0.5)
          : "transparent"};
    ${(props) => props.isFocused && "cursor: pointer"};
    z-index: ${Layers.snipeableZone + 1} !important;
  }
`;

type SnipeableComponentProps = WidgetProps;

function SnipeableComponent(props: SnipeableComponentProps) {
  const { focusWidget } = useWidgetSelection();
  const dispatch = useDispatch();
  const isSnipingMode = useSelector(snipingModeSelector);

  const isFocusedWidget = useSelector(
    (state: AppState) =>
      state.ui.widgetDragResize.focusedWidget === props.widgetId,
  );

  const handleMouseOver = (e: any) => {
    focusWidget && !isFocusedWidget && focusWidget(props.widgetId);
    e.stopPropagation();
  };

  const classNameForTesting = `t--snipeable-${props.type
    .split("_")
    .join("")
    .toLowerCase()}`;

  const className = `${classNameForTesting}`;

  const onSelectWidgetToBind = useCallback(
    (e) => {
      dispatch(
        bindDataToWidget({
          widgetId: props.widgetId,
        }),
      );
      e.stopPropagation();
    },
    [bindDataToWidget, props.widgetId, dispatch],
  );

  return isSnipingMode ? (
    <SnipeableWrapper
      className={className}
      isFocused={isFocusedWidget}
      onClick={onSelectWidgetToBind}
      onMouseOver={handleMouseOver}
    >
      {props.children}
    </SnipeableWrapper>
  ) : (
    props.children
  );
}

export default SnipeableComponent;
