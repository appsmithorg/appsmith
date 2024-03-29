import type { CSSProperties } from "react";
import React, { useCallback } from "react";
import { shouldShowWidgetNameOnWidget } from "layoutSystems/anvil/integrations/onCanvasUISelectors";
import { useSelector } from "react-redux";
import { useWidgetSelection } from "utils/hooks/useWidgetSelection";
import { SelectionRequestType } from "sagas/WidgetSelectUtils";
import styled from "styled-components";
import WidgetFactory from "WidgetProvider/factory";

function getNearestScrollableAncestor(widgetElement: Element) {
  const nearestScrollableModalBody = widgetElement.closest(
    ".appsmith-modal-body",
  );
  if (
    nearestScrollableModalBody &&
    nearestScrollableModalBody.scrollHeight >
      nearestScrollableModalBody?.clientHeight
  ) {
    return nearestScrollableModalBody;
  }
  return widgetElement.closest("#widgets-editor");
}

const widgetNameStyles: CSSProperties = {
  height: "22px",
  position: "fixed",
  top: 0,
  left: 0,
  zIndex: 1000000,
  opacity: 0,
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

    color: var(--ads-color-black-0);
    outline-color: var(--ads-color-orange-600);
    outline-offset: -5px;
    border-start-end-radius: var(--ads-radius-1);
    border-end-end-radius: var(--ads-radius-1);
    ${(props) =>
      props.$disableSpan
        ? "border-start-start-radius: var(--ads-radius-1); border-end-start-radius: var(--ads-radius-1);"
        : ""}

    &:is(:hover, :focus-visible) {
      background: var(--ads-color-orange-700);
      color: var(--ads-color-bloack-0);

      & > svg {
        stroke: currentColor;
        fill: none;
      }
    }

    &:active {
      background: var(--ads-color-orange-800);
    }
  }

  & span {
    inline-size: 3ch;
    cursor: pointer;
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-inline-start: var(--ads-radius-1);
    border-start-start-radius: var(--ads-radius-1);
    border-end-start-radius: var(--ads-radius-1);
    background: var(${(props) => props.$BGCSSVar});

    &:is(:hover, :focus-visible) {
      background: var(--ads-color-orange-700);
      color: var(--ads-color-bloack-0);

      & > svg {
        stroke: currentColor;
        fill: none;
      }
    }

    &:active {
      background: var(--ads-color-orange-800);
    }
  }
`;

export function SplitButton(props: {
  text: string;
  id: string;
  onClick: React.MouseEventHandler;
  onMouseOverCapture: React.MouseEventHandler;
  styles: CSSProperties;
  bGCSSVar: string;
  colorCSSVar: string;
  disableParentToggle: boolean;
}) {
  return (
    <SplitButtonWrapper
      $BGCSSVar={props.bGCSSVar}
      $ColorCSSVar={props.colorCSSVar}
      $disableSpan={props.disableParentToggle}
      id={props.id}
      onMouseMoveCapture={props.onMouseOverCapture}
      style={props.styles}
    >
      {!props.disableParentToggle && (
        <span aria-expanded="false" aria-haspopup="true" title="Select Parent">
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

export function WidgetNameComponent(props: {
  name: string;
  widgetId: string;
  selectionBGCSSVar: string;
  selectionColorCSSVar: string;
  focusBGCSSVar: string;
  focusColorCSSVar: string;
  disableParentSelection: boolean;
}) {
  const shouldShowWidgetName = useSelector(
    shouldShowWidgetNameOnWidget(props.widgetId),
  );
  const { selectWidget } = useWidgetSelection();

  const handleSelect = useCallback((e: React.MouseEvent) => {
    selectWidget(SelectionRequestType.One, [props.widgetId]);
    e.stopPropagation();
  }, []);

  const handleMouseOver = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  if (!shouldShowWidgetName) return null;

  return (
    <SplitButton
      bGCSSVar={props.selectionBGCSSVar}
      colorCSSVar={props.selectionColorCSSVar}
      disableParentToggle={props.disableParentSelection}
      id={`widget-name-${props.widgetId}`}
      onClick={handleSelect}
      onMouseOverCapture={handleMouseOver}
      styles={widgetNameStyles}
      text={props.name}
    />
  );
}

export function OnCanvasUIWidgetNameComponents(
  widgets: Array<{ widgetId: string; widgetName: string; widgetType: string }>,
) {
  // Add signals to abort the scroll event
  // const scrollableElements: NodeListOf<HTMLDivElement | HTMLSelectElement> =
  //   document.querySelectorAll(
  //     "section.canvas.scrollbar-thin, div.appsmith-modal-body",
  //   );

  // scrollableElements.forEach((el: HTMLDivElement | HTMLSelectElement) => {
  //   el.addEventListener("scroll", () => {
  //     const nameEls: NodeListOf<HTMLDivElement> = document.querySelectorAll(
  //       "[id*='widget-name-']",
  //     );

  //     nameEls.forEach((_el: HTMLDivElement) => {
  //       _el.style.opacity = "0";
  //     });
  //   });
  // el.addEventListener("scrollend", () => {
  //   const nameEls: NodeListOf<HTMLDivElement> = document.querySelectorAll(
  //     "[id*='widget-name-']",
  //   );

  //   nameEls.forEach((_el: HTMLDivElement) => {
  //     _el.style.opacity = "1";
  //   });
  // });
  // });

  const renderedNameComponents = widgets.map(
    ({ widgetId, widgetName, widgetType }) => {
      const callback: IntersectionObserverCallback = (entries) => {
        entries.forEach((entry: IntersectionObserverEntry) => {
          const widgetNameComponent: HTMLDivElement | null =
            document.querySelector("#widget-name-" + widgetId);
          const editorElement = document.getElementById("widgets-editor");
          const editorRect = editorElement?.getBoundingClientRect();
          if (widgetNameComponent) {
            if (
              entry.isIntersecting &&
              Math.floor(entry.intersectionRect.top) ===
                Math.floor(entry.boundingClientRect.top)
            ) {
              widgetNameComponent.style.transform = `translate3d(${
                entry.boundingClientRect.left - (editorRect?.left || 0)
              }px, ${entry.boundingClientRect.top - 24 - 40}px, 20px)`;
              widgetNameComponent.style.opacity = "1";
            } else {
              widgetNameComponent.style.opacity = "0";
            }
          }
        });
      };

      const widgetElementSelector = `#anvil_widget_${widgetId}`;
      const widgetElement = document.querySelector(widgetElementSelector);

      if (widgetElement) {
        const nearestScrollableAncestor =
          getNearestScrollableAncestor(widgetElement);
        const options = {
          root: nearestScrollableAncestor,
          threshold: 0.1,
        };
        const observer = new IntersectionObserver(callback, options);

        observer.observe(widgetElement);
      }

      const config = WidgetFactory.getConfig(widgetType);
      const onCanvasUI = config?.onCanvasUI || {
        disableParentSelection: false,
        focusBGCSSVar: "--ads-widget-focus",
        focusColorCSSVar: "--ads-widget-selection",
        selectionBGCSSVar: "--ads-widget-selection",
        selectionColorCSSVar: "--ads-widget-focus",
      };
      return (
        <WidgetNameComponent
          disableParentSelection={onCanvasUI.disableParentSelection}
          focusBGCSSVar={onCanvasUI.focusBGCSSVar}
          focusColorCSSVar={onCanvasUI.focusColorCSSVar}
          key={widgetId}
          name={widgetName}
          selectionBGCSSVar={onCanvasUI.selectionBGCSSVar}
          selectionColorCSSVar={onCanvasUI.selectionColorCSSVar}
          widgetId={widgetId}
        />
      );
    },
  );

  return renderedNameComponents;
}
