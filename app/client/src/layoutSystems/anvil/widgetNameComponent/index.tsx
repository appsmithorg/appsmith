import type { CSSProperties, ForwardedRef } from "react";
import React, { forwardRef, useCallback, useEffect, useRef } from "react";
import { shouldSelectOrFocus } from "layoutSystems/anvil/integrations/onCanvasUISelectors";
import { useSelector } from "react-redux";
import { useWidgetSelection } from "utils/hooks/useWidgetSelection";
import { SelectionRequestType } from "sagas/WidgetSelectUtils";
import styled from "styled-components";
import WidgetFactory from "WidgetProvider/factory";
import type { AppState } from "@appsmith/reducers";

import {
  computePosition,
  autoUpdate,
  flip,
  shift,
  offset,
} from "@floating-ui/dom";

import { FloatingPortal } from "@floating-ui/react";

import { MAIN_CONTAINER_WIDGET_ID } from "constants/WidgetConstants";

const widgetNameStyles: CSSProperties = {
  height: "23px",
  width: "max-content",
  position: "fixed",
  top: 0,
  left: 0,
  visibility: "hidden",
};

const SplitButtonWrapper = styled.div<{
  $BGCSSVar: string;
  $ColorCSSVar: string;
  $disableSpan: boolean;
}>`
  display: inline-flex;
  border-radius: var(--ads-radius-1);
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
    border-start-end-radius: var(--ads-radius-1);
    border-end-end-radius: var(--ads-radius-1);
    ${(props) =>
      props.$disableSpan
        ? "border-start-start-radius: var(--ads-radius-1); border-end-start-radius: var(--ads-radius-1);"
        : ""}
  }

  & span {
    inline-size: 3ch;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-inline-start: var(--ads-radius-1);
    border-start-start-radius: var(--ads-radius-1);
    border-end-start-radius: var(--ads-radius-1);
    background: var(${(props) => props.$BGCSSVar});

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
    disableParentToggle: boolean;
    onSpanClick: React.MouseEventHandler;
    className: string;
  },
  ref: ForwardedRef<HTMLDivElement>,
) {
  return (
    <SplitButtonWrapper
      $BGCSSVar={props.bGCSSVar}
      $ColorCSSVar={props.colorCSSVar}
      $disableSpan={props.disableParentToggle}
      className={props.className}
      id={props.id}
      onMouseMoveCapture={props.onMouseOverCapture}
      ref={ref}
      style={props.styles}
    >
      {!props.disableParentToggle && (
        <span
          aria-expanded="false"
          aria-haspopup="true"
          onClick={props.onSpanClick}
          title="Select Parent"
        >
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
        </span>
      )}
      <button onClick={props.onClick}>{props.text}</button>
    </SplitButtonWrapper>
  );
}

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
  },
  ref: ForwardedRef<HTMLDivElement>,
) {
  const { widgetId } = props;
  const parentId: string | undefined = useSelector(
    (state: AppState) => state.entities.canvasWidgets[widgetId]?.parentId,
  );

  const { selectWidget } = useWidgetSelection();

  const handleSelectParent = useCallback(
    (e: React.MouseEvent) => {
      parentId && selectWidget(SelectionRequestType.One, [parentId]);
      e.stopPropagation();
    },
    [parentId],
  );

  const handleSelect = useCallback((e: React.MouseEvent) => {
    selectWidget(SelectionRequestType.One, [props.widgetId]);
    e.stopPropagation();
  }, []);

  const handleMouseOver = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  return (
    <ForwardedSplitButton
      bGCSSVar={props.bGCSSVar}
      className="on-canvas-ui"
      colorCSSVar={props.colorCSSVar}
      disableParentToggle={props.disableParentSelection}
      id={`widget-name-${widgetId}`}
      onClick={handleSelect}
      onMouseOverCapture={handleMouseOver}
      onSpanClick={handleSelectParent}
      ref={ref}
      styles={widgetNameStyles}
      text={props.name}
    />
  );
}

const ForwardedWidgetNameComponent = forwardRef(WidgetNameComponent);

export function useWidgetName(widgetId: string, widgetName: string) {
  const widgetNameRef = useRef<HTMLDivElement | null>(null);
  const widgetNameComponent = widgetNameRef.current;

  const nameComponentState: "select" | "focus" | "none" = useSelector(
    shouldSelectOrFocus(widgetId),
  );
  const widgetType = useSelector(
    (state: AppState) => state.entities.canvasWidgets[widgetId].type,
  );

  const widgetElement = document.querySelector(
    "#anvil_widget_" + widgetId,
  ) as HTMLDivElement | null;
  let cleanup = () => {};
  useEffect(() => {
    if (widgetElement && widgetNameComponent) {
      cleanup = autoUpdate(widgetElement, widgetNameComponent, () => {
        computePosition(widgetElement as HTMLDivElement, widgetNameComponent, {
          placement: "top-start",
          strategy: "fixed",
          middleware: [flip(), shift(), offset({ mainAxis: 8, crossAxis: -5 })],
        }).then(({ x, y }) => {
          Object.assign(widgetNameComponent.style, {
            left: `${x}px`,
            top: `${y}px`,
            visibility: nameComponentState === "none" ? "hidden" : "visible",
            zIndex: nameComponentState === "focus" ? 9000001 : 9000000,
            // transform: `translate(${roundByDPR(x)}px,${roundByDPR(y)}px,0)`,
          });
        });
      });
    }
    return () => {
      cleanup();
    };
  }, [nameComponentState, widgetElement, widgetNameComponent]);
  if (widgetId === MAIN_CONTAINER_WIDGET_ID) return null;

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
        ref={widgetNameRef}
        selectionBGCSSVar={onCanvasUI.selectionBGCSSVar}
        selectionColorCSSVar={onCanvasUI.selectionColorCSSVar}
        widgetId={widgetId}
      />
    </FloatingPortal>
  );
}
