import React, { useCallback, useEffect, useState } from "react";
import { useSelector } from "react-redux";

import { FloatingPortal } from "@floating-ui/react";

import { MAIN_CONTAINER_WIDGET_ID } from "constants/WidgetConstants";
import { useWidgetDragResize } from "utils/hooks/dragResizeHooks";
import {
  getWidgetDOMElement,
  getWidgetNameComponentStyleProps,
  handleWidgetUpdate,
} from "./utils";
import { AnvilWidgetNameComponent } from "./AnvilWidgetNameComponent";
import { getWidgetErrorCount, shouldSelectOrFocus } from "./selectors";
import type { NameComponentStates } from "./types";
import { generateDragStateForAnvilLayout } from "layoutSystems/anvil/utils/widgetUtils";
import { useWidgetSelection } from "utils/hooks/useWidgetSelection";
import { SelectionRequestType } from "sagas/WidgetSelectUtils";
import { isWidgetSelected } from "selectors/widgetSelectors";

export function AnvilWidgetName(props: {
  widgetId: string;
  widgetName: string;
  layoutId: string;
  parentId?: string;
  widgetType: string;
}) {
  const { layoutId, parentId, widgetId, widgetName, widgetType } = props;
  const nameComponentState: NameComponentStates = useSelector(
    shouldSelectOrFocus(widgetId),
  );

  const generateDragState = useCallback(() => {
    return generateDragStateForAnvilLayout({
      widgetType,
      layoutId,
    });
  }, [widgetType, layoutId]);
  const showError = useSelector(
    (state) => getWidgetErrorCount(state, widgetId) > 0,
  );

  const isParentSelected = useSelector(isWidgetSelected(parentId || ""));

  const { selectWidget } = useWidgetSelection();

  const styleProps = getWidgetNameComponentStyleProps(
    widgetType,
    nameComponentState,
    showError,
    isParentSelected,
  );

  const { setDraggingState } = useWidgetDragResize();

  const onDragStart = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      selectWidget(SelectionRequestType.One, [widgetId]);
      setDraggingState(generateDragState());
    },
    [setDraggingState],
  );

  /** Setup Floating UI logic */

  const [widgetNameComponent, setWidgetNameElement] =
    useState<HTMLDivElement | null>(null);

  const widgetNameRef = useCallback((node) => {
    if (node !== null) {
      setWidgetNameElement(node);
    }
  }, []);

  const widgetElement = getWidgetDOMElement(widgetId);
  const widgetsEditorElement: HTMLDivElement | null = document.getElementById(
    "widgets-editor",
  ) as HTMLDivElement | null;

  let cleanup = () => {};
  useEffect(() => {
    if (
      widgetElement &&
      widgetNameComponent &&
      widgetsEditorElement &&
      nameComponentState !== "none"
    ) {
      cleanup = handleWidgetUpdate(
        widgetElement,
        widgetNameComponent,
        widgetsEditorElement,
        nameComponentState,
      );
    }
    return () => {
      cleanup();
    };
  }, [nameComponentState, widgetElement, widgetNameComponent]);

  /** EO Floating UI Logic */

  // Don't show widget name component for the main container
  if (widgetId === MAIN_CONTAINER_WIDGET_ID) return null;
  // Don't show widget name component if the widget DOM element isn't found
  if (!widgetElement) return null;
  if (nameComponentState === "none") return null;

  return (
    <FloatingPortal>
      <AnvilWidgetNameComponent
        bGCSSVar={styleProps.bGCSSVar}
        colorCSSVar={styleProps.colorCSSVar}
        disableParentSelection={styleProps.disableParentToggle}
        key={widgetId}
        name={widgetName}
        onDragStart={onDragStart}
        parentId={parentId}
        ref={widgetNameRef}
        selectionBGCSSVar={styleProps.selectionBGCSSVar}
        selectionColorCSSVar={styleProps.selectionColorCSSVar}
        showError={showError}
        widgetId={widgetId}
      />
    </FloatingPortal>
  );
}
