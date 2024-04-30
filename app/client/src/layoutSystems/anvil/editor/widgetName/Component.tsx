import type { CSSProperties, ForwardedRef } from "react";
import React, { forwardRef, useCallback, useMemo } from "react";
import { useSelector } from "react-redux";
import { SelectionRequestType } from "sagas/WidgetSelectUtils";
import { useWidgetSelection } from "utils/hooks/useWidgetSelection";
import { ForwardedSplitButton } from "./SplitButton";
import type { AppState } from "@appsmith/reducers";
import { getWidgetErrorCount } from "./selectors";
import {
  ANVIL_WIDGET_NAME_DEBUG_CLICK,
  ANVIL_WIDGET_NAME_TOGGLE_PARENT,
} from "layoutSystems/anvil/messages";
import { createMessage } from "@appsmith/constants/messages";

const widgetNameStyles: CSSProperties = {
  height: "24px", // This is 2px more than the ones in the designs.
  width: "max-content",
  position: "fixed",
  top: 0,
  left: 0,
  visibility: "hidden",
  isolation: "isolate",
};

/**
 *
 * This component is responsible for rendering the widget name in the canvas.
 * It is the interface the connects Appsmith logic to agnostic component logic.
 * It is responsible for providing the following:
 * - Base styling for the widget name.
 * - Creating handlers for selecting parent, the widget and debugging
 * - It also overrides the styling if errors are present.
 *
 * Although, I could move some of the logic to the parent component, I decided to keep it here
 */
export function WidgetNameComponent(
  props: {
    name: string;
    widgetId: string;
    selectionBGCSSVar: string;
    selectionColorCSSVar: string;
    bGCSSVar: string;
    colorCSSVar: string;
    disableParentSelection: boolean;
    onDragStart: React.DragEventHandler;
  },
  ref: ForwardedRef<HTMLDivElement>,
) {
  const { widgetId } = props;

  const parentId: string | undefined = useSelector(
    (state: AppState) => state.entities.canvasWidgets[widgetId]?.parentId,
  );

  const showError = useSelector(
    (state) => getWidgetErrorCount(state, widgetId) > 0,
  );

  // If there is an error, show the widget name in error state
  // This includes background being the error color
  // and font color being white.
  let _bgCSSVar = props.bGCSSVar;
  let _colorCSSVar = props.colorCSSVar;
  if (showError) {
    _bgCSSVar = "--ads-widget-error";
    _colorCSSVar = "--ads-color-black-0";
  }

  /** Widget Selection Handlers */
  const { selectWidget } = useWidgetSelection();
  const handleSelectParent = useCallback(
    (e: React.MouseEvent) => {
      parentId && selectWidget(SelectionRequestType.One, [parentId]);
      e.stopPropagation();
    },
    [parentId],
  );

  const handleSelectWidget = useCallback((e: React.MouseEvent) => {
    selectWidget(SelectionRequestType.One, [props.widgetId]);
    e.stopPropagation();
  }, []);

  const handleMouseOver = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDebugClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
    },
    [widgetId],
  );
  /** EO Widget Selection Handlers */

  const leftToggle = useMemo(() => {
    return {
      disable: props.disableParentSelection,
      onClick: handleSelectParent,
      title: createMessage(ANVIL_WIDGET_NAME_TOGGLE_PARENT),
    };
  }, [props.disableParentSelection, handleSelectParent]);

  const rightToggle = useMemo(() => {
    return {
      disable: !showError,
      onClick: handleDebugClick,
      title: createMessage(ANVIL_WIDGET_NAME_DEBUG_CLICK),
    };
  }, [showError, handleDebugClick]);

  return (
    <ForwardedSplitButton
      bGCSSVar={_bgCSSVar}
      colorCSSVar={_colorCSSVar}
      id={`widget-name-${widgetId}`}
      leftToggle={leftToggle}
      onClick={handleSelectWidget}
      onDragStart={props.onDragStart}
      onMouseOverCapture={handleMouseOver}
      ref={ref}
      rightToggle={rightToggle}
      styles={widgetNameStyles}
      text={props.name}
    />
  );
}

export const ForwardedWidgetNameComponent = forwardRef(WidgetNameComponent);
