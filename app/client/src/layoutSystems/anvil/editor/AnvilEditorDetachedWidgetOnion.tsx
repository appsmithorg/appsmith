import React from "react";
import type { BaseWidgetProps } from "widgets/BaseWidgetHOC/withBaseWidgetHOC";
import { AnvilWidgetComponent } from "../common/widgetComponent/AnvilWidgetComponent";
import { useObserveDetachedWidget } from "layoutSystems/common/utils/LayoutElementPositionsObserver/usePositionObserver";

import { generateClassName } from "utils/generators";
import { useWidgetBorderStyles } from "../common/hooks/useWidgetBorderStyles";

import {
  // isCurrentWidgetFocused,
  isWidgetSelected,
} from "selectors/widgetSelectors";
// import throttle from "lodash/throttle";
import { SelectionRequestType } from "sagas/WidgetSelectUtils";
import { useSelector } from "react-redux";
import { combinedPreviewModeSelector } from "selectors/editorSelectors";
import { useWidgetSelection } from "utils/hooks/useWidgetSelection";

function useHandleWidgetFocusAndSelect(widgetId: string) {
  const { selectWidget } = useWidgetSelection();
  // const isFocused = useSelector(isCurrentWidgetFocused(widgetId));
  const isPreviewMode = useSelector(combinedPreviewModeSelector);
  const isSelected = useSelector(isWidgetSelected(widgetId));
  // const handleWidgetFocus = () => {
  //   if (!isFocused && !isPreviewMode) {
  //     focusWidget(widgetId);
  //   }
  // };
  // const throttledWidgetFocusHandler = throttle(handleWidgetFocus, 1000, {
  //   leading: true,
  // });

  const handleWidgetSelect = (e: any) => {
    if (!isPreviewMode && !isSelected && e.currentTarget === e.target) {
      selectWidget(SelectionRequestType.One, [widgetId]);
    }
  };
  const className = generateClassName(widgetId);
  const element = document.querySelector(`.${className}`);
  if (element) {
    element.addEventListener("click", handleWidgetSelect, { capture: true });
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
