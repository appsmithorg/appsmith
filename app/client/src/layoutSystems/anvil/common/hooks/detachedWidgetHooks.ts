import { useWidgetBorderStyles } from "./useWidgetBorderStyles";
import { useDispatch, useSelector } from "react-redux";
import { useWidgetSelection } from "utils/hooks/useWidgetSelection";
import { SELECT_ANVIL_WIDGET_CUSTOM_EVENT } from "layoutSystems/anvil/utils/constants";
import log from "loglevel";
import { useEffect, useMemo } from "react";
import { getAnvilWidgetDOMId } from "layoutSystems/common/utils/LayoutElementPositionsObserver/utils";
import { getCurrentlyOpenAnvilDetachedWidgets } from "layoutSystems/anvil/integrations/modalSelectors";
import { getCanvasWidgetsStructure } from "ee/selectors/entitiesSelector";
import type { CanvasWidgetStructure } from "WidgetProvider/constants";
import { selectCombinedPreviewMode } from "selectors/gitModSelectors";
/**
 * This hook is used to select and focus on a detached widget
 * As detached widgets are outside of the layout flow, we need to access the correct element in the DOM
 * @param widgetId The widget ID which needs to be selected
 * @returns
 */
export function useHandleDetachedWidgetSelect(widgetId: string) {
  const dispatch = useDispatch();
  const isPreviewMode = useSelector(selectCombinedPreviewMode);

  const className = getAnvilWidgetDOMId(widgetId);
  const element = document.querySelector(`.${className}`);
  const { focusWidget } = useWidgetSelection();

  useEffect(() => {
    // The select handler sends a custom event that is handled at a singular place in the AnvilEditorCanvas
    // The event listener is actually attached to the body and not the AnvilEditorCanvas. This can be changed in the future if necessary.
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleWidgetSelect = (e: any) => {
      // EventPhase 2 is the Target phase.
      // This signifies that the event has reached the target element.
      // And since the target element is the detached widget, we can
      // be sure that the click happened on the modal widget and not
      // on any of the children. It is now save to select the detached widget
      element?.dispatchEvent(
        new CustomEvent(SELECT_ANVIL_WIDGET_CUSTOM_EVENT, {
          bubbles: true,
          detail: {
            widgetId,
            metaKey: e.metaKey,
            ctrlKey: e.ctrlKey,
            shiftKey: e.shiftKey,
            isDetached: true,
          },
        }),
      );
      e.stopPropagation();
    };

    // The handler for focusing on a detached widget
    // It makes sure to check if the app mode is preview or not
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleWidgetFocus = (e: any) => {
      // In case of a detached widget like (modal widget) fully capture the focus event.
      e.stopImmediatePropagation();
      e.preventDefault();
      !isPreviewMode && dispatch(focusWidget(widgetId));
    };

    // Registering and unregistering listeners
    if (element && !isPreviewMode) {
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
export function useAddBordersToDetachedWidgets(
  widgetId: string,
  widgetType: string,
) {
  // Get the styles to be applied
  const borderStyled = useWidgetBorderStyles(widgetId, widgetType);

  // Get the element from the DOM
  const className = getAnvilWidgetDOMId(widgetId);
  const element: HTMLDivElement | null = document.querySelector(
    `.${className}`,
  );

  if (element) {
    element.style.outlineOffset = borderStyled.outlineOffset ?? "unset";
    element.style.outline = borderStyled.outline ?? "none";
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
export function useDetachedChildren() {
  const start = performance.now();
  // Get all widgets
  const widgets = useSelector(getCanvasWidgetsStructure);
  const currentlyOpenWidgets = useSelector(
    getCurrentlyOpenAnvilDetachedWidgets,
  );
  // Filter out the detached children and denormalise each of the detached widgets to generate
  // a DSL like hierarchy
  const detachedChildren = useMemo(() => {
    const allChildren = currentlyOpenWidgets.map((widgetId) => {
      return (
        widgets.children &&
        widgets.children.find((each) => each.widgetId === widgetId)
      );
    });

    return allChildren.filter((child) => !!child) as CanvasWidgetStructure[];
  }, [currentlyOpenWidgets, widgets]);
  const end = performance.now();

  log.debug("### Computing detached children took:", end - start, "ms");

  return detachedChildren;
}
