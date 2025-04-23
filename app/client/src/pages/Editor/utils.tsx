import React, { useEffect, useMemo, useState } from "react";
import ReactDOM from "react-dom";
import { useLocation } from "react-router";
import { debounce, random, sortBy } from "lodash";
import type {
  WidgetCardsGroupedByTags,
  WidgetTags,
  WidgetType,
} from "constants/WidgetConstants";
import { WIDGET_TAGS } from "constants/WidgetConstants";
import ResizeObserver from "resize-observer-polyfill";
import WidgetFactory from "WidgetProvider/factory";
import {
  createMessage,
  WIDGET_DEPRECATION_MESSAGE,
} from "ee/constants/messages";
import type { URLBuilderParams } from "ee/entities/URLRedirect/URLAssembly";
import { useSelector } from "react-redux";
import { getCurrentPageId } from "selectors/editorSelectors";
import type { WidgetCardProps } from "widgets/BaseWidget";
import type { ActionResponse } from "api/ActionAPI";
import type { Module } from "ee/constants/ModuleConstants";
import { MODULE_TYPE } from "ee/constants/ModuleConstants";
import {
  dbQueryIcon,
  ENTITY_ICON_SIZE,
  EntityIcon,
  JsFileIconV2,
} from "pages/Editor/Explorer/ExplorerIcons";
import { getAssetUrl } from "ee/utils/airgapHelpers";
import { type Plugin, PluginType } from "entities/Plugin";
import ImageAlt from "assets/images/placeholder-image.svg";
import { Icon } from "@appsmith/ads";
import { objectKeys } from "@appsmith/utils";

export const draggableElement = (
  id: string,
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  element: any,
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onPositionChange: any,
  parentElement?: Element | null,
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    const { left: calculatedLeft, top: calculatedTop } =
      calculateBoundaryConfinedPosition(left, top);

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

  const resizeObserver = new ResizeObserver(function () {
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
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    dragHandler.addEventListener("click", (e: any) => e.stopPropagation());
  };

  OnInit();
};

const createDragHandler = (
  id: string,
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    dragElement.setAttribute("data-testid", cypressSelectorDragHandle);
  }

  oldDragHandler
    ? el.replaceChild(dragElement, oldDragHandler)
    : el.appendChild(dragElement);
  ReactDOM.render(dragHandle(), dragElement);

  return dragElement;
};

// Function to access nested property in an object
// TODO: Fix this the next time the file is edited
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getNestedValue = (obj: Record<string, any>, path = "") => {
  return path.split(".").reduce((prev, cur) => {
    return prev && prev[cur];
  }, obj);
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

export function buildDeprecationWidgetMessage(replacingWidgetName: string) {
  const deprecationMessage = createMessage(
    WIDGET_DEPRECATION_MESSAGE,
    replacingWidgetName,
  );

  return `${deprecationMessage}`;
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

// Ended up not using it, but leaving it here, incase anyone needs a helper function to generate random numbers.
export const generateRandomNumbers = (
  lowerBound = 1000,
  upperBound = 9000,
  allowFloating = false,
) => {
  return random(lowerBound, upperBound, allowFloating);
};

export const groupWidgetCardsByTags = (widgetCards: WidgetCardProps[]) => {
  const tagsOrder = Object.values(WIDGET_TAGS);
  const groupedCards: WidgetCardsGroupedByTags = {} as WidgetCardsGroupedByTags;

  tagsOrder.forEach((tag: WidgetTags) => {
    groupedCards[tag] = [];
  });

  widgetCards.forEach((item) => {
    if (item.tags) {
      item.tags.forEach((tag) => {
        if (groupedCards[tag]) {
          groupedCards[tag].push(item);
        } else {
          groupedCards[tag] = [item];
        }
      });
    }
  });

  objectKeys(groupedCards).forEach((tag) => {
    if (tag === WIDGET_TAGS.SUGGESTED_WIDGETS) return;

    groupedCards[tag] = sortBy(groupedCards[tag], [
      "displayOrder",
      "displayName",
    ]);
  });

  return groupedCards;
};

export const transformTextToSentenceCase = (s: string) => {
  return s.slice(0, 1).toUpperCase() + s.slice(1).toLowerCase();
};

export const actionResponseDisplayDataFormats = (
  actionData?: ActionResponse,
  defaultDisplayFormat: { title: string; value: string } = {
    title: "",
    value: "",
  },
) => {
  let responseDisplayFormat: { title: string; value: string };
  let responseDataTypes: { key: string; title: string }[];

  if (actionData && actionData.responseDisplayFormat) {
    responseDataTypes = actionData.dataTypes.map((data) => {
      return {
        key: data.dataType,
        title: data.dataType,
      };
    });
    responseDisplayFormat = {
      title: actionData.responseDisplayFormat,
      value: actionData.responseDisplayFormat,
    };
  } else {
    responseDataTypes = [];
    responseDisplayFormat = defaultDisplayFormat;
  }

  return {
    responseDataTypes,
    responseDisplayFormat,
  };
};

function resolveQueryModuleIcon(
  iconLocation: string,
  pluginType: string,
  isLargeIcon: boolean,
) {
  if (iconLocation)
    return (
      <EntityIcon
        height={`${isLargeIcon ? ENTITY_ICON_SIZE * 2 : ENTITY_ICON_SIZE}px`}
        width={`${isLargeIcon ? ENTITY_ICON_SIZE * 2 : ENTITY_ICON_SIZE}px`}
      >
        <img alt="entityIcon" src={getAssetUrl(iconLocation)} />
      </EntityIcon>
    );
  else if (pluginType === PluginType.DB) return dbQueryIcon;
}

export function resolveIcon({
  iconLocation,
  isLargeIcon = false,
  moduleType,
  pluginType,
}: {
  iconLocation: string;
  pluginType: string;
  moduleType: string;
  isLargeIcon?: boolean;
}) {
  if (moduleType === MODULE_TYPE.JS) {
    return isLargeIcon ? JsFileIconV2(34, 34) : JsFileIconV2(16, 16);
  } else {
    return resolveQueryModuleIcon(iconLocation, pluginType, isLargeIcon);
  }
}

export function getModuleIcon(
  module: Module | undefined,
  pluginImages: Record<string, string>,
  isLargeIcon = false,
) {
  return module ? (
    resolveIcon({
      iconLocation: pluginImages[module.pluginId] || "",
      pluginType: module.pluginType,
      moduleType: module.type,
      isLargeIcon,
    })
  ) : (
    <EntityIcon
      height={`${isLargeIcon ? ENTITY_ICON_SIZE * 2 : ENTITY_ICON_SIZE}px`}
      width={`${isLargeIcon ? ENTITY_ICON_SIZE * 2 : ENTITY_ICON_SIZE}px`}
    >
      <Icon name="module" />
    </EntityIcon>
  );
}

export function getPluginImagesFromPlugins(plugins: Plugin[]) {
  const pluginImages: Record<string, string> = {};

  plugins.forEach((plugin) => {
    pluginImages[plugin.id] = plugin?.iconLocation ?? ImageAlt;
  });

  return pluginImages;
}
