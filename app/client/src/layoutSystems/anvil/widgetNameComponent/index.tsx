import type { CSSProperties, ForwardedRef } from "react";
import React, {
  forwardRef,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { shouldSelectOrFocus } from "layoutSystems/anvil/integrations/onCanvasUISelectors";
import { useDispatch, useSelector } from "react-redux";
import { useWidgetSelection } from "utils/hooks/useWidgetSelection";
import { SelectionRequestType } from "sagas/WidgetSelectUtils";
import styled from "styled-components";
import WidgetFactory from "WidgetProvider/factory";
import type { AppState } from "@appsmith/reducers";

import type { MiddlewareState } from "@floating-ui/dom";
import {
  computePosition,
  autoUpdate,
  flip,
  shift,
  offset,
  detectOverflow,
  hide,
} from "@floating-ui/dom";

import { FloatingPortal } from "@floating-ui/react";

import { MAIN_CONTAINER_WIDGET_ID } from "constants/WidgetConstants";
import { getWidgetErrorCount } from "../integrations/selectors";
import { debugWidget } from "../integrations/actions";
import { useWidgetDragResize } from "utils/hooks/dragResizeHooks";

const widgetNameStyles: CSSProperties = {
  height: "24px",
  width: "max-content",
  position: "fixed",
  top: 0,
  left: 0,
  visibility: "hidden",
  isolation: "isolate",
};

const SplitButtonWrapper = styled.div<{
  $BGCSSVar: string;
  $ColorCSSVar: string;
  $disableLeftSpan: boolean;
  $disableRightSpan: boolean;
}>`
  display: inline-flex;
  border-radius: var(--ads-on-canvas-ui-border-radius);
  color: var(${(props) => props.$ColorCSSVar});
  fill: var(${(props) => props.$ColorCSSVar});
  stroke: var(${(props) => props.$ColorCSSVar});

  touch-action: manipulation;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
  gap: 1px;

  & button {
    cursor: pointer;
    appearance: none;
    background: none;
    border: none;
    background: var(${(props) => props.$BGCSSVar});

    display: inline-flex;
    align-items: center;
    gap: 1ch;
    white-space: nowrap;

    font-family: inherit;
    font-size: inherit;
    font-weight: 500;

    padding-block: 1.25ch;
    padding-inline: 2ch;

    color: var(${(props) => props.$ColorCSSVar});
    outline-color: var(${(props) => props.$BGCSSVar});
    outline-offset: -5px;
    ${(props) =>
      props.$disableLeftSpan &&
      "border-start-start-radius: var(--ads-on-canvas-ui-border-radius); border-end-start-radius: var(--ads-on-canvas-ui-border-radius);"}
    ${(props) =>
      props.$disableRightSpan &&
      "border-end-end-radius: var(--ads-on-canvas-ui-border-radius); border-start-end-radius: var(--ads-on-canvas-ui-border-radius);"}
  }

  & span {
    inline-size: 3ch;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-inline-start: var(--ads-on-canvas-ui-border-radius);
    border-start-start-radius: var(--ads-on-canvas-ui-border-radius);
    border-end-start-radius: var(--ads-on-canvas-ui-border-radius);
    background: var(${(props) => props.$BGCSSVar});
    color: var(${(props) => props.$ColorCSSVar});

    &:is(:hover, :focus-visible) {
      filter: brightness(0.8);
      color: var(${(props) => props.$ColorCSSVar});
      & > svg {
        stroke: currentColor;
        fill: none;
      }
    }

    &:active {
      filter: brightness(0.6);
    }
  }

  & span:nth-of-type(${(props) => (props.$disableLeftSpan ? 1 : 2)}) {
    border-inline-end: var(--ads-on-canvas-ui-border-radius);
    border-start-start-radius: 0px;
    border-end-start-radius: 0px;
    border-end-end-radius: var(--ads-on-canvas-ui-border-radius);
    border-start-end-radius: var(--ads-on-canvas-ui-border-radius);
  }
`;

export function SplitButton(
  props: {
    text: string;
    id: string;
    onClick: React.MouseEventHandler;
    onMouseOverCapture: React.MouseEventHandler;
    styles: CSSProperties;
    bGCSSVar: string;
    colorCSSVar: string;
    leftToggle: {
      disable: boolean;
      onClick: React.MouseEventHandler;
      title: string;
    };
    rightToggle: {
      disable: boolean;
      onClick: React.MouseEventHandler;
      title: string;
    };
    className: string;
    onDragStart: React.DragEventHandler;
  },
  ref: ForwardedRef<HTMLDivElement>,
) {
  return (
    <SplitButtonWrapper
      $BGCSSVar={props.bGCSSVar}
      $ColorCSSVar={props.colorCSSVar}
      $disableLeftSpan={props.leftToggle.disable}
      $disableRightSpan={props.rightToggle.disable}
      className={props.className}
      draggable
      id={props.id}
      onDragStart={props.onDragStart}
      onMouseMoveCapture={props.onMouseOverCapture}
      ref={ref}
      style={props.styles}
    >
      {!props.leftToggle.disable && (
        <span
          aria-expanded="false"
          aria-haspopup="true"
          onClick={props.leftToggle.onClick}
          title={props.leftToggle.title}
        >
          {selectParentSVG}
        </span>
      )}
      <button onClick={props.onClick}>{props.text}</button>
      {!props.rightToggle.disable && (
        <span
          aria-expanded="false"
          aria-haspopup="true"
          onClick={props.rightToggle.onClick}
          title={props.rightToggle.title}
        >
          {errorSVG}
        </span>
      )}
    </SplitButtonWrapper>
  );
}
const selectParentSVG = (
  <svg
    aria-hidden="true"
    height="15"
    viewBox="0 0 15 15"
    width="15"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M7.5 11V3.5M7.5 3.5L10.5 6.5M7.5 3.5L4.5 6.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
const errorSVG = (
  <svg
    fill="none"
    height="15"
    viewBox="0 0 15 15"
    width="15"
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle cx="7.49999" cy="7.50005" r="5.85723" stroke="white" />
    <path
      d="M7.5 4.5V8.5"
      stroke="white"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M7.5 10.51V10.5"
      stroke="white"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const ForwardedSplitButton = forwardRef(SplitButton);

export function WidgetNameComponent(
  props: {
    name: string;
    widgetId: string;
    selectionBGCSSVar: string;
    selectionColorCSSVar: string;
    bGCSSVar: string;
    colorCSSVar: string;
    disableParentSelection: boolean;
    onDragStart: React.DragEventHandler;
  },
  ref: ForwardedRef<HTMLDivElement>,
) {
  const dispatch = useDispatch();
  const { widgetId } = props;
  const parentId: string | undefined = useSelector(
    (state: AppState) => state.entities.canvasWidgets[widgetId]?.parentId,
  );

  const showError = useSelector(
    (state) => getWidgetErrorCount(state, widgetId) > 0,
  );

  const { selectWidget } = useWidgetSelection();

  const handleSelectParent = useCallback(
    (e: React.MouseEvent) => {
      parentId && selectWidget(SelectionRequestType.One, [parentId]);
      e.stopPropagation();
    },
    [parentId],
  );

  const handleDebugClick = useCallback(
    (e: React.MouseEvent) => {
      dispatch(debugWidget(widgetId));
      e.stopPropagation();
      e.preventDefault();
    },
    [widgetId],
  );

  const handleSelect = useCallback((e: React.MouseEvent) => {
    selectWidget(SelectionRequestType.One, [props.widgetId]);
    e.stopPropagation();
  }, []);

  const handleMouseOver = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const leftToggle = useMemo(() => {
    return {
      disable: props.disableParentSelection,
      onClick: handleSelectParent,
      title: "Select parent widget",
    };
  }, [props.disableParentSelection, handleSelectParent]);

  const rightToggle = useMemo(() => {
    return {
      disable: !showError,
      onClick: handleDebugClick,
      title: "Debug issue",
    };
  }, [showError, handleDebugClick]);

  let _bgCSSVar = props.bGCSSVar;
  let _colorCSSVar = props.colorCSSVar;
  if (showError) {
    _bgCSSVar = "--ads-widget-error";
    _colorCSSVar = "--ads-color-black-0";
  }

  return (
    <ForwardedSplitButton
      bGCSSVar={_bgCSSVar}
      className="on-canvas-ui"
      colorCSSVar={_colorCSSVar}
      id={`widget-name-${widgetId}`}
      leftToggle={leftToggle}
      onClick={handleSelect}
      onDragStart={props.onDragStart}
      onMouseOverCapture={handleMouseOver}
      ref={ref}
      rightToggle={rightToggle}
      styles={widgetNameStyles}
      text={props.name}
    />
  );
}

const ForwardedWidgetNameComponent = forwardRef(WidgetNameComponent);

function floatingUIMiddlewareOverflow(boundaryEl: HTMLDivElement) {
  return {
    name: "containWithinCanvas",
    async fn(state: MiddlewareState) {
      const overflow = await detectOverflow(state, {
        boundary: boundaryEl,
      });
      return {
        data: {
          shouldShift: overflow.right >= 0,
          overflowAmount: overflow.right,
        },
      };
    },
  };
}

export function useWidgetName(
  widgetId: string,
  widgetName: string,
  parentId?: string,
) {
  const [widgetNameComponent, setWidgetNameElement] =
    useState<HTMLDivElement | null>(null);
  const nameComponentState: "select" | "focus" | "none" = useSelector(
    shouldSelectOrFocus(widgetId),
  );
  const widgetType = useSelector(
    (state: AppState) => state.entities.canvasWidgets[widgetId].type,
  );
  const { setDraggingState } = useWidgetDragResize();

  const onDragStart = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      if (nameComponentState === "select") {
        const startPoints = {
          top: 0,
          left: 0,
        };
        setDraggingState({
          isDragging: true,
          dragGroupActualParent: parentId,
          draggingGroupCenter: { widgetId },
          startPoints,
          draggedOn: parentId,
        });
      }
    },
    [setDraggingState, nameComponentState],
  );

  const widgetNameRef = useCallback((node) => {
    if (node !== null) {
      setWidgetNameElement(node);
    }
  }, []);

  let widgetElement = document.querySelector(
    "#anvil_widget_" + widgetId,
  ) as HTMLDivElement | null;

  if (!widgetElement) {
    widgetElement = document.getElementsByClassName(
      "anvil_widget_" + widgetId,
    )[0] as HTMLDivElement | null;
  }

  const WidgetsEditorElement = document.getElementById("widgets-editor");

  let cleanup = () => {};
  useEffect(() => {
    if (widgetElement && widgetNameComponent) {
      cleanup = autoUpdate(widgetElement, widgetNameComponent, () => {
        computePosition(widgetElement as HTMLDivElement, widgetNameComponent, {
          placement: "top-start",
          strategy: "fixed",
          middleware: [
            flip(),
            shift(),
            offset({ mainAxis: 8, crossAxis: -5 }),
            floatingUIMiddlewareOverflow(
              WidgetsEditorElement as HTMLDivElement,
            ),
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
              nameComponentState === "none" ||
              middlewareData.hide?.referenceHidden
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
    return () => {
      cleanup();
    };
  }, [nameComponentState, widgetElement, widgetNameComponent]);
  if (widgetId === MAIN_CONTAINER_WIDGET_ID) return null;
  if (!widgetElement) return null;

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

  let _disableParentSelection = onCanvasUI.disableParentSelection;
  if (nameComponentState === "focus") {
    _disableParentSelection = true;
  }

  return (
    <FloatingPortal>
      <ForwardedWidgetNameComponent
        bGCSSVar={bGCSSVar}
        colorCSSVar={colorCSSVar}
        disableParentSelection={_disableParentSelection}
        key={widgetId}
        name={widgetName}
        onDragStart={onDragStart}
        ref={widgetNameRef}
        selectionBGCSSVar={onCanvasUI.selectionBGCSSVar}
        selectionColorCSSVar={onCanvasUI.selectionColorCSSVar}
        widgetId={widgetId}
      />
    </FloatingPortal>
  );
}
