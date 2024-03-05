import { useWidgetBorderStyles } from "./useWidgetBorderStyles";
import { useDispatch, useSelector } from "react-redux";
import { useWidgetSelection } from "utils/hooks/useWidgetSelection";
import { combinedPreviewModeSelector } from "selectors/editorSelectors";
import { SELECT_ANVIL_WIDGET_CUSTOM_EVENT } from "layoutSystems/anvil/utils/constants";
import type { RenderModes } from "constants/WidgetConstants";
import { MAIN_CONTAINER_WIDGET_ID } from "constants/WidgetConstants";
import { renderChildWidget } from "layoutSystems/common/utils/canvasUtils";
import type { WidgetProps } from "widgets/BaseWidget";
import { getRenderMode } from "selectors/editorSelectors";
import { denormalize } from "utils/canvasStructureHelpers";
import type { CanvasWidgetStructure } from "WidgetProvider/constants";
import { getWidgets } from "sagas/selectors";
import log from "loglevel";
import { useEffect, useMemo } from "react";
import { getAnvilWidgetDOMId } from "layoutSystems/common/utils/LayoutElementPositionsObserver/utils";

/**
 * This hook is used to select and focus on a detached widget
 * As detached widgets are outside of the layout flow, we need to access the correct element in the DOM
 * @param widgetId The widget ID which needs to be selected
 * @returns
 */
export function useHandleDetachedWidgetSelect(widgetId: string) {
  const dispatch = useDispatch();
  const isPreviewMode = useSelector(combinedPreviewModeSelector);

  const className = getAnvilWidgetDOMId(widgetId);
  const element = document.querySelector(`.${className}`);
  const { focusWidget } = useWidgetSelection();

  useEffect(() => {
    // The select handler sends a custom event that is handled at a singular place in the AnvilMainCanvas
    // The event listener is actually attached to the body and not the AnvilMainCanvas. This can be changed in the future if necessary.
    const handleWidgetSelect = (e: any) => {
      // EventPhase 2 is the Target phase.
      // This signifies that the event has reached the target element.
      // And since the target element is the detached widget, we can
      // be sure that the click happened on the modal widget and not
      // on any of the children. It is now save to select the detached widget
      if (e.eventPhase === 2) {
        element?.dispatchEvent(
          new CustomEvent(SELECT_ANVIL_WIDGET_CUSTOM_EVENT, {
            bubbles: true,
            detail: {
              widgetId,
              metaKey: e.metaKey,
              ctrlKey: e.ctrlKey,
              shiftKey: e.shiftKey,
            },
          }),
        );
      }
      e.stopPropagation();
    };

    // The handler for focusing on a detached widget
    // It makes sure to check if the app mode is preview or not
    const handleWidgetFocus = (e: any) => {
      if (e.eventPhase === 2) {
        !isPreviewMode && dispatch(focusWidget(widgetId));
      }
    };

    // Registering and unregistering listeners
    if (element) {
      element.addEventListener("click", handleWidgetSelect, {
        passive: false,
        capture: false,
      });
      element.addEventListener("mouseover", handleWidgetFocus);
    }
    return () => {
      if (element) {
        element.removeEventListener("click", handleWidgetSelect);
        element.removeEventListener("mouseover", handleWidgetFocus);
      }
    };
  }, [element, focusWidget, isPreviewMode, widgetId]);
}

/**
 * A hook to add borders to detached widgets
 * As detached widgets are outside of the layout flow, we need to access the correct element in the DOM
 * and apply the styles to it
 *
 * This creates a dependency where the correct element in the detached widget needs to have the same class name
 * Using a common function to generate the class name, this uses the widgetId as the seed and reliably generates the same classname
 * for the same widgetId
 * @param widgetId The widget ID which needs to be styled
 */
export function useAddBordersToDetachedWidgets(widgetId: string) {
  // Get the styles to be applied
  const borderStyled = useWidgetBorderStyles(widgetId);

  // Get the element from the DOM
  const className = getAnvilWidgetDOMId(widgetId);
  const element: HTMLDivElement | null = document.querySelector(
    `.${className}`,
  );

  if (element) {
    element.style.border = borderStyled.border ?? "none";
  }
}

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

export function useRenderDetachedChildren(
  widgetId: string,
  children: CanvasWidgetStructure[],
) {
  const renderMode: RenderModes = useSelector(getRenderMode);

  // Get the detached children to render on the canvas
  const detachedChildren = useDetachedChildren(children);
  let renderDetachedChildren = null;
  if (widgetId === MAIN_CONTAINER_WIDGET_ID) {
    renderDetachedChildren = detachedChildren.map((child) =>
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
  }
  return renderDetachedChildren;
}
