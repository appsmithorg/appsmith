import { generateClassName } from "utils/generators";
import { useWidgetBorderStyles } from "./useWidgetBorderStyles";
import { useDispatch, useSelector } from "react-redux";
import { useWidgetSelection } from "utils/hooks/useWidgetSelection";
import { combinedPreviewModeSelector } from "selectors/editorSelectors";
import { SELECT_ANVIL_WIDGET_CUSTOM_EVENT } from "layoutSystems/anvil/utils/constants";

/**
 * This hook is used to select and focus on a detached widget
 * As detached widgets are outside of the layout flow, we need to access the correct element in the DOM
 * @param widgetId The widget ID which needs to be selected
 * @returns
 */
export function useHandleDetachedWidgetSelect(widgetId: string) {
  const dispatch = useDispatch();
  const isPreviewMode = useSelector(combinedPreviewModeSelector);

  const className = generateClassName(widgetId);
  const element = document.querySelector(`.${className}`);
  const { focusWidget } = useWidgetSelection();

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
          detail: { widgetId: widgetId },
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
    element.addEventListener("pointerenter", handleWidgetFocus);
  }
  return () => {
    if (element) {
      element.removeEventListener("click", handleWidgetSelect);
      element.removeEventListener("pointerenter", handleWidgetFocus);
    }
  };
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
  const className = generateClassName(widgetId);
  const element: HTMLDivElement | null = document.querySelector(
    `.${className}`,
  );

  // Apply the styles to the element
  // If the style is not present, set it to none
  if (element) {
    if (borderStyled.border) element.style.border = borderStyled.border;
    else element.style.border = "none";
    if (borderStyled.outline) element.style.outline = borderStyled.outline;
    else element.style.outline = "none";
    if (borderStyled.outlineOffset)
      element.style.outlineOffset = borderStyled.outlineOffset;
    else element.style.outlineOffset = "none";
    if (borderStyled.boxShadow)
      element.style.boxShadow = borderStyled.boxShadow;
    else element.style.boxShadow = "none";
    if (borderStyled.borderRadius)
      element.style.borderRadius = borderStyled.borderRadius;
    else element.style.borderRadius = "none";
  }
}
