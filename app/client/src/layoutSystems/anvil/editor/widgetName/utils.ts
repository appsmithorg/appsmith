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
  let widgetElement = document.querySelector(
    "#anvil_widget_" + widgetId,
  ) as HTMLDivElement | null;

  if (!widgetElement) {
    widgetElement = document.getElementsByClassName(
      "anvil_widget_" + widgetId,
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
  return autoUpdate(widgetElement, widgetNameComponent, () => {
    computePosition(widgetElement as HTMLDivElement, widgetNameComponent, {
      placement: "top-start",
      strategy: "fixed",
      middleware: [
        flip(),
        shift(),
        offset({ mainAxis: 8, crossAxis: -5 }),
        getOverflowMiddleware(widgetsEditorElement as HTMLDivElement),
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
        visibility:
          nameComponentState === "none" || middlewareData.hide?.referenceHidden
            ? "hidden"
            : "visible",
        zIndex:
          nameComponentState === "focus"
            ? "calc(var(--ads-on-canvas-ui-zindex) + 1)"
            : "var(--ads-on-canvas-ui-zindex)",
      });
    });
  });
}

export function getWidgetNameComponentStyleProps(
  widgetType: string,
  nameComponentState: NameComponentStates,
) {
  const config = WidgetFactory.getConfig(widgetType);
  const onCanvasUI = config?.onCanvasUI || {
    disableParentSelection: false,
    focusBGCSSVar: "--ads-widget-focus",
    focusColorCSSVar: "--ads-widget-selection",
    selectionBGCSSVar: "--ads-widget-selection",
    selectionColorCSSVar: "--ads-widget-focus",
  };
  const bGCSSVar =
    nameComponentState === "focus"
      ? onCanvasUI.focusBGCSSVar
      : onCanvasUI.selectionBGCSSVar;
  const colorCSSVar =
    nameComponentState === "focus"
      ? onCanvasUI.focusColorCSSVar
      : onCanvasUI.selectionColorCSSVar;

  let disableParentToggle = onCanvasUI.disableParentSelection;
  if (nameComponentState === "focus") {
    disableParentToggle = true;
  }
  return {
    disableParentToggle,
    bGCSSVar,
    colorCSSVar,
    selectionBGCSSVar: onCanvasUI.selectionBGCSSVar,
    selectionColorCSSVar: onCanvasUI.selectionColorCSSVar,
  };
}
