import { AppState } from "@appsmith/reducers";
import equal from "fast-deep-equal/es6";
import React, { ReactNode, useCallback } from "react";
import { useSelector } from "react-redux";
import { getIsPropertyPaneVisible } from "selectors/propertyPaneSelectors";
import {
  getFocusedParentToOpen,
  isWidgetSelected,
  shouldWidgetIgnoreClicksSelector,
} from "selectors/widgetSelectors";
import styled from "styled-components";
import { stopEventPropagation } from "utils/AppsmithUtils";
import { scrollCSS } from "widgets/WidgetUtils";
import { useWidgetSelection } from "./useWidgetSelection";

const ContentWrapper = styled.div`
  width: 100%;
  height: 100%;
  ${scrollCSS}
`;

export function ClickContentToOpenPropPane({
  children,
  widgetId,
}: {
  widgetId: string;
  children?: ReactNode;
}) {
  const { focusWidget } = useWidgetSelection();

  const clickToSelectWidget = useClickToSelectWidget(widgetId);

  const focusedWidget = useSelector(
    (state: AppState) => state.ui.widgetDragResize.focusedWidget,
  );

  const isResizing = useSelector(
    (state: AppState) => state.ui.widgetDragResize.isResizing,
  );
  const isDragging = useSelector(
    (state: AppState) => state.ui.widgetDragResize.isDragging,
  );
  const isResizingOrDragging = !!isResizing || !!isDragging;
  const handleMouseOver = (e: any) => {
    focusWidget &&
      !isResizingOrDragging &&
      focusedWidget !== widgetId &&
      focusWidget(widgetId);
    e.stopPropagation();
  };

  return (
    <ContentWrapper
      onClick={stopEventPropagation}
      onMouseDownCapture={clickToSelectWidget}
      onMouseOver={handleMouseOver}
    >
      {children}
    </ContentWrapper>
  );
}

export const useClickToSelectWidget = (widgetId: string) => {
  const { focusWidget, selectWidget } = useWidgetSelection();
  const isPropPaneVisible = useSelector(getIsPropertyPaneVisible);
  const isSelected = useSelector(isWidgetSelected(widgetId));
  const parentWidgetToOpen = useSelector(getFocusedParentToOpen, equal);
  const shouldIgnoreClicks = useSelector(
    shouldWidgetIgnoreClicksSelector(widgetId),
  );

  const clickToSelectWidget = useCallback(
    (e: any) => {
      // Ignore click captures
      // 1. If the component is resizing or dragging because it is handled internally in draggable component.
      // 2. If table filter property pane is open.
      if (shouldIgnoreClicks) return;
      if ((!isPropPaneVisible && isSelected) || !isSelected) {
        const isMultiSelect = e.metaKey || e.ctrlKey || e.shiftKey;

        if (parentWidgetToOpen) {
          selectWidget(parentWidgetToOpen.widgetId, isMultiSelect);
        } else {
          selectWidget(widgetId, isMultiSelect);
          focusWidget(widgetId);
        }

        if (isMultiSelect) {
          e.stopPropagation();
        }
      }
    },
    [shouldIgnoreClicks, isPropPaneVisible, isSelected, parentWidgetToOpen],
  );
  return clickToSelectWidget;
};
