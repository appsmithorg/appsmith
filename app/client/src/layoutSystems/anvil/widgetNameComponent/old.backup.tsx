import type { CSSProperties, MutableRefObject } from "react";
import React, { useCallback, useEffect, useRef } from "react";
import { shouldSelectOrFocus } from "layoutSystems/anvil/integrations/onCanvasUISelectors";
import { useSelector } from "react-redux";
import { useWidgetSelection } from "utils/hooks/useWidgetSelection";
import { SelectionRequestType } from "sagas/WidgetSelectUtils";
import styled from "styled-components";
import WidgetFactory from "WidgetProvider/factory";
import type { AppState } from "@appsmith/reducers";

// import memoize from "proxy-memoize";
import { MAIN_CONTAINER_WIDGET_ID } from "constants/WidgetConstants";
import debounce from "lodash/debounce";
class IntersectionObserverManager {
  _observer: IntersectionObserver;
  _observedNodes: Set<Element>;
  constructor(observer: IntersectionObserver) {
    this._observer = observer;
    this._observedNodes = new Set();
  }
  observe(node: Element) {
    this._observedNodes.add(node);
    this._observer.observe(node);
  }
  unobserve(node: Element) {
    this._observedNodes.delete(node);
    this._observer.unobserve(node);
  }
  disconnect() {
    this._observedNodes.clear();
    this._observer.disconnect();
  }
  refresh() {
    for (const node of this._observedNodes) {
      this._observer.unobserve(node);
      this._observer.observe(node);
    }
  }
}
const getWidgets = (state: AppState) =>
  Object.values(state.entities.canvasWidgets).map((widget) => ({
    widgetId: widget.widgetId,
    widgetName: widget.widgetName,
    widgetType: widget.type,
    parentId: widget.parentId,
  }));
// const getMemoizedWidgets = memoize(getWidgets);

function handleScroll(isHidden: MutableRefObject<boolean>) {
  if (isHidden.current === false) {
    const nameEls: NodeListOf<HTMLDivElement> = document.querySelectorAll(
      "[id*='widget-name-']",
    );
    nameEls.forEach((el: HTMLDivElement) => {
      el.style.opacity = "0";
    });
    isHidden.current = true;
  }
}
function handleScrollEnd(isHidden: MutableRefObject<boolean>) {
  if (isHidden.current === true) {
    isHidden.current = false;
    ObserverQueue.forEach((manager) => {
      manager.refresh();
    });
  }
}
export function useScrollHandlerForWidgetNameComponent() {
  const isHidden = useRef(false);
  // TODO(abhinav): This is really bad. Figure out a better way
  const hasModalWidgetType = !!document.querySelector(".appsmith-modal-body");
  useEffect(() => {
    const scrollableNodes = document.querySelectorAll(
      ".appsmith-modal-body, .canvas.scrollbar-thin",
    );

    scrollableNodes.forEach((node) => {
      node.addEventListener("scroll", () => handleScroll(isHidden), {
        passive: false,
      });
      node.addEventListener("scrollend", () => handleScrollEnd(isHidden), {
        passive: false,
      });
    });
    return () => {
      scrollableNodes.forEach((node) => {
        node.removeEventListener("scroll", () => handleScroll(isHidden));
        node.removeEventListener("scrollend", () => handleScrollEnd(isHidden));
      });
    };
  }, [hasModalWidgetType]);
}

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
    position: relative;
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

export function SplitButton(props: {
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
}) {
  return (
    <SplitButtonWrapper
      $BGCSSVar={props.bGCSSVar}
      $ColorCSSVar={props.colorCSSVar}
      $disableSpan={props.disableParentToggle}
      className={props.className}
      id={props.id}
      onMouseMoveCapture={props.onMouseOverCapture}
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

export function WidgetNameComponent(props: {
  name: string;
  widgetId: string;
  selectionBGCSSVar: string;
  selectionColorCSSVar: string;
  focusBGCSSVar: string;
  focusColorCSSVar: string;
  disableParentSelection: boolean;
}) {
  const nameComponentState: "select" | "focus" | "none" = useSelector(
    shouldSelectOrFocus(props.widgetId),
  );
  const parentId: string | undefined = useSelector(
    (state: AppState) => state.entities.canvasWidgets[props.widgetId]?.parentId,
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

  if (nameComponentState === "none") {
    widgetNameStyles.opacity = 0;
  } else {
    widgetNameStyles.opacity = 1;
  }

  const bGCSSVar =
    nameComponentState === "focus"
      ? props.focusBGCSSVar
      : props.selectionBGCSSVar;
  const colorCSSVar =
    nameComponentState === "focus"
      ? props.focusColorCSSVar
      : props.selectionColorCSSVar;

  if (nameComponentState === "focus") {
    widgetNameStyles.zIndex = 9000001;
  } else {
    widgetNameStyles.zIndex = 9000000;
  }

  let _disableParentSelection = props.disableParentSelection;
  if (nameComponentState === "focus") {
    _disableParentSelection = true;
  }

  return (
    <SplitButton
      bGCSSVar={bGCSSVar}
      className="on-canvas-ui"
      colorCSSVar={colorCSSVar}
      disableParentToggle={_disableParentSelection}
      id={`widget-name-${props.widgetId}`}
      onClick={handleSelect}
      onMouseOverCapture={handleMouseOver}
      onSpanClick={handleSelectParent}
      styles={widgetNameStyles}
      text={props.name}
    />
  );
}

function intersectionObserverCallback(entries: IntersectionObserverEntry[]) {
  entries.forEach((entry: IntersectionObserverEntry) => {
    const widgetId = entry.target.id.split("_")[2];
    const widgetNameComponent: HTMLDivElement | null = document.querySelector(
      "#widget-name-" + widgetId,
    );
    const editorElement = document.getElementById("widgets-editor");
    const editorRect = editorElement?.getBoundingClientRect();
    if (widgetNameComponent) {
      if (
        entry.isIntersecting &&
        Math.floor(entry.intersectionRect.top) ===
          Math.floor(entry.boundingClientRect.top) &&
        editorRect
      ) {
        widgetNameComponent.style.transform = `translate3d(${
          entry.boundingClientRect.left - 6
        }px, ${entry.boundingClientRect.top - 30}px, 20px)`;
      } else {
        widgetNameComponent.style.opacity = "0";
      }
    }
  });
}

function resizeObserverCallback() {
  ObserverQueue.forEach((manager) => {
    manager.refresh();
  });
}

const debouncedResizeObserverCallback = debounce(resizeObserverCallback, 100);

const resizeObserver = new ResizeObserver(debouncedResizeObserverCallback);

const options = {
  root: null,
  threshold: 0.1,
};
const viewPortObserver = new IntersectionObserver(
  intersectionObserverCallback,
  options,
);
const ObserverQueue = new Map<string, IntersectionObserverManager>();
ObserverQueue.set(
  "viewport",
  new IntersectionObserverManager(viewPortObserver),
);

let isVisible = true;
if (visualViewport) {
  visualViewport.onresize = () => {
    regularFn();
    // debouncedFn();
  };

  const regularFn = () => {
    if (isVisible) {
      const nameEls: NodeListOf<HTMLDivElement> = document.querySelectorAll(
        "[id*='widget-name-']",
      );
      nameEls.forEach((el: HTMLDivElement) => {
        el.style.opacity = "0";
      });
      isVisible = false;
    }
  };

  // const debouncedFn = debounce(function () {
  //   console.log("###### Calling this:");
  //   ObserverQueue.forEach((manager) => {
  //     manager.refresh();
  //   });
  //   isVisible = true;
  // }, 1500);
}

export function OnCanvasUIWidgetNameComponents() {
  useScrollHandlerForWidgetNameComponent();
  const widgets = useSelector(getWidgets);

  let widgetElementCount = 0;

  const renderedNameComponents = widgets.map(
    ({ parentId, widgetId, widgetName, widgetType }) => {
      if (widgetId === MAIN_CONTAINER_WIDGET_ID) return null;
      const widgetElementSelector = `#anvil_widget_${widgetId}`;
      const widgetElement = document.querySelector(widgetElementSelector);
      if (widgetElement) widgetElementCount++;
      if (widgetElement) {
        resizeObserver.observe(widgetElement);
        const nearestScrollableAncestor =
          getNearestScrollableAncestor(widgetElement);

        const options = {
          root: nearestScrollableAncestor,
          threshold: [0.1, 1],
        };
        if (nearestScrollableAncestor) {
          const observerManager = ObserverQueue.get(
            parentId || MAIN_CONTAINER_WIDGET_ID,
          );
          if (!observerManager) {
            const observer = new IntersectionObserver(
              intersectionObserverCallback,
              options,
            );
            const manager = new IntersectionObserverManager(observer);
            manager.observe(widgetElement);
            // TODO(abhinav): This doesn't really work because the parent could be a zone
            // or a section and not the Modal Widget. Maybe have the getNearestScrollableAncestor
            // return the modal widget Id.
            ObserverQueue.set(parentId || MAIN_CONTAINER_WIDGET_ID, manager);
          } else {
            observerManager.observe(widgetElement);
          }
        } else {
          const observerManager = ObserverQueue.get("viewport");
          if (observerManager) observerManager.observe(widgetElement);
        }
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
  if (widgetElementCount === 0) return null;
  widgetElementCount = 0;
  return renderedNameComponents;
}
