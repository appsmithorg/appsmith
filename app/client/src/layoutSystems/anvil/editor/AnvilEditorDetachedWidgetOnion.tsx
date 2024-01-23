import React from "react";
import type { BaseWidgetProps } from "widgets/BaseWidgetHOC/withBaseWidgetHOC";
import { AnvilWidgetComponent } from "../common/widgetComponent/AnvilWidgetComponent";
import { useObserveDetachedWidget } from "layoutSystems/common/utils/LayoutElementPositionsObserver/usePositionObserver";

import { generateClassName } from "utils/generators";
import { useWidgetBorderStyles } from "../common/hooks/useWidgetBorderStyles";

import // isCurrentWidgetFocused,
"selectors/widgetSelectors";
// import throttle from "lodash/throttle";

function useHandleWidgetFocusAndSelect(widgetId: string) {
  const className = generateClassName(widgetId);
  const element = document.querySelector(`.${className}`);
  const handleWidgetSelect = () => {
    element?.dispatchEvent(
      new CustomEvent("selectWidget", {
        bubbles: false,
        detail: { widgetId: widgetId },
      }),
    );
    // e.stopPropagation();
  };

  if (element) {
    element.addEventListener("click", handleWidgetSelect, {
      passive: true,
    });
    // element.addEventListener("mouseenter", throttledWidgetFocusHandler, {
    //   capture: true,
    // });
  }
  return () => {
    if (element) {
      element.removeEventListener("click", handleWidgetSelect);
      // element.removeEventListener("mouseenter", throttledWidgetFocusHandler);
    }
  };
}

function useAddBordersToDetachedWidgets(widgetId: string) {
  const className = generateClassName(widgetId);
  const element: HTMLDivElement | null = document.querySelector(
    `.${className}`,
  );
  const borderStyled = useWidgetBorderStyles(widgetId);
  if (element) {
    if (borderStyled.border) element.style.border = borderStyled.border;
    if (borderStyled.outline) element.style.outline = borderStyled.outline;
    if (borderStyled.outlineOffset)
      element.style.outlineOffset = borderStyled.outlineOffset;
    if (borderStyled.boxShadow)
      element.style.boxShadow = borderStyled.boxShadow;
    if (borderStyled.borderRadius)
      element.style.borderRadius = borderStyled.borderRadius;
  }
}

/**
 * AnvilEditorDetachedWidgetOnion
 *
 * Component that wraps the BaseWidget implementation of a Detached Widget with Editor specific wrappers
 * needed in Anvil.
 *
 * Editor specific wrappers are wrappers added to perform actions in the editor.
 * - AnvilWidgetComponent: provides layer to auto update dimensions based on content/ add skeleton widget on loading state
 *
 * @returns Enhanced Widget
 */
export const AnvilEditorDetachedWidgetOnion = (
  props: BaseWidgetProps,
): JSX.Element => {
  useObserveDetachedWidget(props.widgetId);
  useHandleWidgetFocusAndSelect(props.widgetId);
  useAddBordersToDetachedWidgets(props.widgetId);

  return (
    <AnvilWidgetComponent {...props}>{props.children}</AnvilWidgetComponent>
  );
};
