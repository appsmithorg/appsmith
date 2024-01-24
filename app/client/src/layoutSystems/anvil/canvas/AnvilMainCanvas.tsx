import type { BaseWidgetProps } from "widgets/BaseWidgetHOC/withBaseWidgetHOC";
import { AnvilCanvas } from "./AnvilCanvas";
import React, { useMemo } from "react";
import { useCanvasActivationStates } from "../canvasArenas/hooks/mainCanvas/useCanvasActivationStates";
import { useCanvasActivation } from "../canvasArenas/hooks/mainCanvas/useCanvasActivation";
import type { RenderModes } from "constants/WidgetConstants";
import { MAIN_CONTAINER_WIDGET_ID } from "constants/WidgetConstants";
import { useSelector } from "react-redux";
import { getWidgets } from "sagas/selectors";
import { getRenderMode } from "selectors/editorSelectors";
import { renderChildWidget } from "layoutSystems/common/utils/canvasUtils";
import type { CanvasWidgetStructure } from "WidgetProvider/constants";
import { denormalize } from "utils/canvasStructureHelpers";
import type { WidgetProps } from "widgets/BaseWidget";
import log from "loglevel";
import { useSelectWidgetListener } from "../common/hooks/useSelectWidgetListener";

/**
 * This hook computes the list of detached children to render on the Canvas
 * As the detached widgets are not going to be within any layout, they need to be rendered as siblings to the main container
 *
 * The hook takes care of generating the "DSL" format for the detached children, which is used by the layout system to render
 * @param children
 * @returns
 */
function useDetachedChildren(children: CanvasWidgetStructure[]) {
  const start = performance.now();
  // Get all widgets
  const widgets = useSelector(getWidgets);
  // Filter out the detached children and denormalise each of the detached widgets to generate
  // a DSL like hierarchy
  const detachedChildren = useMemo(() => {
    return children
      .map((child) => widgets[child.widgetId])
      .filter((child) => child.detachFromLayout === true)
      .map((child) => {
        return denormalize(child.widgetId, widgets);
      });
  }, [children, widgets]);
  const end = performance.now();
  log.debug("### Computing detached children took:", end - start, "ms");
  return detachedChildren;
}

export const AnvilMainCanvas = (props: BaseWidgetProps) => {
  const anvilCanvasActivationStates = useCanvasActivationStates();
  useCanvasActivation(anvilCanvasActivationStates);
  const renderMode: RenderModes = useSelector(getRenderMode);

  // Get the detached children to render on the canvas
  const detachedChildren = useDetachedChildren(props.children);

  const renderDetachedChildren = detachedChildren.map((child) =>
    renderChildWidget({
      childWidgetData: child as WidgetProps,
      defaultWidgetProps: {},
      noPad: false,
      // Adding these properties as the type insists on providing this
      // while it is not required for detached children
      layoutSystemProps: { parentColumnSpace: 1, parentRowSpace: 1 },
      renderMode: renderMode,
      widgetId: MAIN_CONTAINER_WIDGET_ID,
    }),
  );
  useSelectWidgetListener();
  return (
    <>
      {renderDetachedChildren}
      <AnvilCanvas {...props} />
    </>
  );
};
