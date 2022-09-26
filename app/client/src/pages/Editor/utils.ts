import { getDependenciesFromInverseDependencies } from "components/editorComponents/Debugger/helpers";
import _, { debounce } from "lodash";
import { useEffect, useMemo, useState } from "react";
import ReactDOM from "react-dom";
import { useLocation } from "react-router";
import { WidgetType } from "constants/WidgetConstants";
import ResizeObserver from "resize-observer-polyfill";
import WidgetFactory from "utils/WidgetFactory";
import {
  createMessage,
  DEPRECATION_WIDGET_REPLACEMENT_MESSAGE,
  WIDGET_DEPRECATION_MESSAGE,
} from "@appsmith/constants/messages";
import { URLBuilderParams } from "RouteBuilder";
import { useSelector } from "react-redux";
import { getCurrentPageId } from "selectors/editorSelectors";

export const draggableElement = (
  id: string,
  element: any,
  onPositionChange: any,
  parentElement?: Element | null,
  initPostion?: any,
  renderDragBlockPositions?: {
    left?: string;
    top?: string;
    zIndex?: string;
    position?: string;
  },
  dragHandle?: () => JSX.Element,
  cypressSelectorDragHandle?: string,
) => {
  let newXPos = 0,
    newYPos = 0,
    oldXPos = 0,
    oldYPos = 0;
  let dragHandler = element;
  let isDragged = !!initPostion;

  const setElementPosition = () => {
    element.style.top = initPostion.top + "px";
    element.style.left = initPostion.left + "px";
  };

  const dragMouseDown = (e: MouseEvent) => {
    e = e || window.event;
    oldXPos = e.clientX;
    oldYPos = e.clientY;
    document.onmouseup = closeDragElement;
    document.onmousemove = elementDrag;
  };

  const calculateBoundaryConfinedPosition = (
    calculatedLeft: number,
    calculatedTop: number,
  ) => {
    const bottomBarOffset = 34;

    /*
      Default to 70 for a save offset that can also
      handle the pagination Bar.
    */
    const canvasTopOffset = parentElement?.getBoundingClientRect().top || 70;

    if (calculatedLeft <= 0) {
      calculatedLeft = 0;
    }

    if (calculatedTop <= canvasTopOffset) {
      calculatedTop = canvasTopOffset;
    }

    if (calculatedLeft >= window.innerWidth - element.clientWidth) {
      calculatedLeft = window.innerWidth - element.clientWidth;
    }

    if (
      calculatedTop >=
      window.innerHeight - (element.clientHeight + bottomBarOffset)
    ) {
      calculatedTop =
        window.innerHeight - element.clientHeight - bottomBarOffset;
    }

    return {
      left: calculatedLeft,
      top: calculatedTop,
    };
  };

  const elementDrag = (e: MouseEvent) => {
    e = e || window.event;
    e.preventDefault();
    newXPos = oldXPos - e.clientX;
    newYPos = oldYPos - e.clientY;
    oldXPos = e.clientX;
    oldYPos = e.clientY;
    const calculatedTop = element.offsetTop - newYPos;
    const calculatedLeft = element.offsetLeft - newXPos;
    element.style.top = calculatedTop + "px";
    element.style.left = calculatedLeft + "px";
    const validFirstDrag = !isDragged && newXPos !== 0 && newYPos !== 0;
    if (validFirstDrag) {
      resizeObserver.observe(element);
      isDragged = true;
    }
  };

  const calculateNewPosition = () => {
    const { height, left, top, width } = element.getBoundingClientRect();
    const isElementOpen = height && width;
    const {
      left: calculatedLeft,
      top: calculatedTop,
    } = calculateBoundaryConfinedPosition(left, top);

    return {
      updatePosition: isDragged && isElementOpen,
      left: calculatedLeft,
      top: calculatedTop,
    };
  };

  const updateElementPosition = () => {
    const calculatedPositionData = calculateNewPosition();
    if (calculatedPositionData.updatePosition) {
      const { left, top } = calculatedPositionData;
      onPositionChange({
        left: left,
        top: top,
      });
      element.style.top = top + "px";
      element.style.left = left + "px";
    }
  };

  const closeDragElement = () => {
    updateElementPosition();
    document.onmouseup = null;
    document.onmousemove = null;
  };
  const debouncedUpdatePosition = debounce(updateElementPosition, 50);

  const resizeObserver = new ResizeObserver(function() {
    debouncedUpdatePosition();
  });

  if (isDragged) {
    resizeObserver.observe(element);
  }

  const OnInit = () => {
    if (dragHandle) {
      dragHandler = createDragHandler(
        id,
        element,
        dragHandle,
        renderDragBlockPositions,
        cypressSelectorDragHandle,
      );
    }
    if (initPostion) {
      setElementPosition();
    }
    dragHandler.addEventListener("mousedown", dragMouseDown);
    // stop clicks from propogating to widget editor.
    dragHandler.addEventListener("click", (e: any) => e.stopPropagation());
  };

  OnInit();
};

const createDragHandler = (
  id: string,
  el: any,
  dragHandle: () => JSX.Element,
  renderDragBlockPositions?: {
    left?: string;
    top?: string;
    zIndex?: string;
    position?: string;
  },
  cypressSelectorDragHandle?: string,
) => {
  const oldDragHandler = document.getElementById(`${id}-draghandler`);
  const dragElement = document.createElement("div");
  dragElement.setAttribute("id", `${id}-draghandler`);
  dragElement.style.position = renderDragBlockPositions?.position ?? "absolute";
  dragElement.style.left = renderDragBlockPositions?.left ?? "135px";
  dragElement.style.top = renderDragBlockPositions?.top ?? "0px";
  dragElement.style.zIndex = renderDragBlockPositions?.zIndex ?? "3";

  if (cypressSelectorDragHandle) {
    dragElement.setAttribute("data-cy", cypressSelectorDragHandle);
  }

  oldDragHandler
    ? el.replaceChild(dragElement, oldDragHandler)
    : el.appendChild(dragElement);
  ReactDOM.render(dragHandle(), dragElement);
  return dragElement;
};

// Function to access nested property in an object
const getNestedValue = (obj: Record<string, any>, path = "") => {
  return path.split(".").reduce((prev, cur) => {
    return prev && prev[cur];
  }, obj);
};

export const useIsWidgetActionConnectionPresent = (
  widgets: any,
  actions: any,
  deps: any,
): boolean => {
  const actionLables = actions.map((action: any) => action.config.name);

  let isBindingAvailable = !!Object.values(widgets).find((widget: any) => {
    const depsConnections = getDependenciesFromInverseDependencies(
      deps,
      widget.widgetName,
    );
    return !!_.intersection(depsConnections?.directDependencies, actionLables)
      .length;
  });

  if (!isBindingAvailable) {
    isBindingAvailable = !!Object.values(widgets).find((widget: any) => {
      return (
        widget.dynamicTriggerPathList &&
        !!widget.dynamicTriggerPathList.find((path: { key: string }) => {
          return !!actionLables.find((label: string) => {
            const snippet = getNestedValue(widget, path.key);
            return snippet ? snippet.indexOf(`${label}.run`) > -1 : false;
          });
        })
      );
    });
  }
  return isBindingAvailable;
};

export const useQuery = () => {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
};

/**
 * Method that returns if the WidgetType is deprecated along with,
 * deprecated widget's display name (currentWidgetName) and
 * the name of the widget that is being replaced with (widgetReplacedWith)
 *
 * @param WidgetType
 * @returns
 */
export function isWidgetDeprecated(WidgetType: WidgetType) {
  const currentWidgetConfig = WidgetFactory.widgetConfigMap.get(WidgetType);
  const isDeprecated = !!currentWidgetConfig?.isDeprecated;
  let widgetReplacedWith;
  if (isDeprecated && currentWidgetConfig?.replacement) {
    widgetReplacedWith = WidgetFactory.widgetConfigMap.get(
      currentWidgetConfig.replacement,
    )?.displayName;
  }

  return {
    isDeprecated,
    currentWidgetName: currentWidgetConfig?.displayName,
    widgetReplacedWith,
  };
}

export function buildDeprecationWidgetMessage(
  currentWidgetName: string,
  replacingWidgetName: string,
) {
  const widgetName = currentWidgetName ? `${currentWidgetName} ` : "";
  const deprecationMessage = createMessage(
    WIDGET_DEPRECATION_MESSAGE,
    widgetName,
  );
  const deprecatedReplacementMessage = replacingWidgetName
    ? createMessage(DEPRECATION_WIDGET_REPLACEMENT_MESSAGE, replacingWidgetName)
    : "";

  return `${deprecationMessage}${deprecatedReplacementMessage}`;
}

/**
 * Use this hook if you are try to set href in components that could possibly mount before the application is initialized.
 * Eg. Deploy button in header.
 * @param urlBuilderFn
 * @param params
 * @returns URL
 */
export function useHref<T extends URLBuilderParams>(
  urlBuilderFn: (params: T) => string,
  params: T,
) {
  const [href, setHref] = useState("");
  // Current pageId selector serves as delay to generate urls
  const pageId = useSelector(getCurrentPageId);
  useEffect(() => {
    if (pageId) setHref(urlBuilderFn(params));
  }, [params, urlBuilderFn, pageId]);

  return href;
}
