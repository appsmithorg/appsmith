import React, { useCallback } from "react";
import type { ReactNode } from "react";

import styled from "styled-components";
import { WIDGET_PADDING } from "constants/WidgetConstants";
import { useDispatch, useSelector } from "react-redux";
import type { DefaultRootState } from "react-redux";
import { getColorWithOpacity } from "constants/DefaultTheme";
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

interface SnipeableComponentProps {
  widgetId: string;
  type: string;
  children: ReactNode;
}

/**
 * SnipeableComponent
 *
 * Component that enhances the widget in sniping mode state.
 * Makes sure the widget is focused on Hover and allows the widget to be snipped on clicking on it.
 *
 */

function SnipeableComponent(props: SnipeableComponentProps) {
  const { focusWidget } = useWidgetSelection();
  const dispatch = useDispatch();
  const isSnipingMode = useSelector(snipingModeSelector);

  const isFocusedWidget = useSelector(
    (state: DefaultRootState) =>
      state.ui.widgetDragResize.focusedWidget === props.widgetId,
  );

  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    // eslint-disable-next-line react/jsx-no-useless-fragment
    <>{props.children}</>
  );
}

export default SnipeableComponent;
