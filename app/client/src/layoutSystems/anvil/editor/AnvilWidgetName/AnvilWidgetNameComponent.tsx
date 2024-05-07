import type { ForwardedRef } from "react";
import React, { forwardRef, useCallback, useMemo } from "react";
import { SelectionRequestType } from "sagas/WidgetSelectUtils";
import { useWidgetSelection } from "utils/hooks/useWidgetSelection";
import { SplitButton } from "./SplitButton";
import {
  ANVIL_WIDGET_NAME_DEBUG_CLICK,
  ANVIL_WIDGET_NAME_TOGGLE_PARENT,
} from "layoutSystems/anvil/common/messages";
import { createMessage } from "@appsmith/constants/messages";
import { debugWidget } from "layoutSystems/anvil/integrations/actions";
import { useDispatch } from "react-redux";

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
export function _AnvilWidgetNameComponent(
  props: {
    name: string;
    widgetId: string;
    parentId?: string;
    selectionBGCSSVar: string;
    selectionColorCSSVar: string;
    bGCSSVar: string;
    colorCSSVar: string;
    disableParentSelection: boolean;
    onDragStart: React.DragEventHandler;
    showError: boolean;
  },
  ref: ForwardedRef<HTMLDivElement>,
) {
  const dispatch = useDispatch();
  const { parentId } = props;

  /** Widget Selection Handlers */
  const { selectWidget } = useWidgetSelection();
  const handleSelectParent = useCallback(() => {
    parentId && selectWidget(SelectionRequestType.One, [parentId]);
  }, [parentId]);

  const handleSelectWidget = useCallback(() => {
    selectWidget(SelectionRequestType.One, [props.widgetId]);
  }, [props.widgetId]);

  const handleDebugClick = useCallback(() => {
    dispatch(debugWidget(props.widgetId));
  }, [props.widgetId]);
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
      disable: !props.showError,
      onClick: handleDebugClick,
      title: createMessage(ANVIL_WIDGET_NAME_DEBUG_CLICK),
    };
  }, [props.showError, handleDebugClick]);

  return (
    <SplitButton
      bGCSSVar={props.bGCSSVar}
      colorCSSVar={props.colorCSSVar}
      leftToggle={leftToggle}
      onClick={handleSelectWidget}
      onDragStart={props.onDragStart}
      ref={ref}
      rightToggle={rightToggle}
      text={props.name}
    />
  );
}

export const AnvilWidgetNameComponent = forwardRef(_AnvilWidgetNameComponent);
