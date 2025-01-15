import type { MiddlewareState } from "@floating-ui/dom";
import {
  autoUpdate,
  computePosition,
  detectOverflow,
  flip,
  hide,
  offset,
  shift,
} from "@floating-ui/dom";
import WidgetFactory from "WidgetProvider/factory";
import type { NameComponentStates } from "./types";
import { getAnvilWidgetDOMId } from "layoutSystems/common/utils/LayoutElementPositionsObserver/utils";

/**
 * @param boundaryEl Element that acts as the boundaries for the overflow computations.
 * @returns Middleware to be used by the floating UI.
 *
 * This middleware is used to detect overflow of the floating UI element beyond the provided boundary element.
 * For example, if the element is the Widget Editor Canvas, then overflow amount is calculated based whether the
 * floating UI component overflows the canvas.
 */
export function getOverflowMiddleware(boundaryEl: HTMLDivElement) {
  return {
    name: "containWithinCanvas",
    async fn(state: MiddlewareState) {
      const overflow = await detectOverflow(state, {
        boundary: boundaryEl,
      });

      return {
        data: {
          overflowAmount: overflow.right,
        },
      };
    },
  };
}

export function getWidgetDOMElement(widgetId: string): HTMLDivElement | null {
  const selector = getAnvilWidgetDOMId(widgetId);
  let widgetElement = document.querySelector(
    `#${selector}`,
  );

  if (!widgetElement) {
    widgetElement = document.getElementsByClassName(
      selector,
    )[0] as HTMLDivElement | null;
  }

  return widgetElement;
}

/**
 *
 * @param widgetElement The Widget DOM element
 * @param widgetNameComponent The Widget Name component DOM element
 * @param widgetsEditorElement The Widget Editor Canvas DOM element
 * @param nameComponentState The current state of the Widget Name Component
 * @returns Floating UI's cleanup function to be used by the caller.
 */
export function handleWidgetUpdate(
  widgetElement: HTMLDivElement,
  widgetNameComponent: HTMLDivElement,
  widgetsEditorElement: HTMLDivElement,
  nameComponentState: NameComponentStates,
) {
  return autoUpdate(
    widgetElement,
    widgetNameComponent,
    () => {
      computePosition(widgetElement, widgetNameComponent, {
        placement: "top-start",
        strategy: "fixed",
        middleware: [
          flip(),
          shift(),
          offset({ mainAxis: 0, crossAxis: -5 }),
          getOverflowMiddleware(widgetsEditorElement),
          hide({ strategy: "referenceHidden" }),
          hide({ strategy: "escaped" }),
        ],
      }).then(({ middlewareData, x, y }) => {
        let shiftOffset = 0;

        if (middlewareData.containWithinCanvas.overflowAmount > 0) {
          shiftOffset = middlewareData.containWithinCanvas.overflowAmount + 5;
        }

        Object.assign(widgetNameComponent.style, {
          left: `${x - shiftOffset}px`,
          top: `${y}px`,
          visibility: middlewareData.hide?.referenceHidden
            ? "hidden"
            : "visible",
          zIndex:
            nameComponentState === "focus"
              ? "calc(var(--on-canvas-ui-zindex) + 1)"
              : "var(--on-canvas-ui-zindex)",
        });
      });
    },
    { animationFrame: true },
  );
}

export function getWidgetNameComponentStyleProps(
  widgetType: string,
  nameComponentState: NameComponentStates,
  showError: boolean,
) {
  const config = WidgetFactory.getConfig(widgetType);
  const onCanvasUI = config?.onCanvasUI || {
    disableParentSelection: false,
    focusBGCSSVar: "--on-canvas-ui-widget-focus",
    focusColorCSSVar: "--on-canvas-ui-widget-selection",
    selectionBGCSSVar: "--on-canvas-ui-widget-selection",
    selectionColorCSSVar: "--on-canvas-ui-widget-focus",
  };
  let bGCSSVar =
    nameComponentState === "focus"
      ? onCanvasUI.focusBGCSSVar
      : onCanvasUI.selectionBGCSSVar;
  let colorCSSVar =
    nameComponentState === "focus"
      ? onCanvasUI.focusColorCSSVar
      : onCanvasUI.selectionColorCSSVar;

  // If there is an error, show the widget name in error state
  // This includes background being the error color
  // and font color being white.
  if (showError) {
    bGCSSVar = "--on-canvas-ui-widget-error";
    colorCSSVar = "--on-canvas-ui-white";
  }

  return {
    disableParentToggle: onCanvasUI.disableParentSelection,
    bGCSSVar,
    colorCSSVar,
    selectionBGCSSVar: onCanvasUI.selectionBGCSSVar,
    selectionColorCSSVar: onCanvasUI.selectionColorCSSVar,
  };
}
