export const CANVAS_WIDGET = '[type="CANVAS_WIDGET"]';
export const CONTAINER_SELECTOR =
  ":is(.t--widget-containerwidget, .t--widget-formwidget)";
const NON_FOCUSABLE_WIDGET_CLASS =
  ".t--widget-textwidget, .t--widget-ratewidget, [disabled]";
export const JSONFORM_WIDGET = ".t--widget-jsonformwidget";
export const CHECKBOXGROUP_WIDGET = ".t--widget-checkboxgroupwidget";
export const FOCUS_SELECTOR =
  "a, input, select, textarea, button, object, audio, video, [tabindex='-1']";
export const WIDGET_SELECTOR = `.positioned-widget:is(:not(${NON_FOCUSABLE_WIDGET_CLASS}))`;
const TABBABLE_NODES = /input|select|textarea|button|object/;

/**
 * returns the tabbable descendants of the current node
 *
 * @param currentNode
 * @param shiftKey
 * @returns
 */
export function getTabbableDescendants(
  currentNode: HTMLElement,
  shiftKey = false,
): HTMLElement[] {
  const activeWidget = currentNode.closest(WIDGET_SELECTOR) as HTMLElement;

  const siblings = getWidgetSiblingsOfNode(currentNode);
  const domRect = activeWidget.getBoundingClientRect();

  const sortedSiblings = sortWidgetsByPosition(
    { top: domRect.top, left: domRect.left },
    siblings,
    shiftKey,
  );

  return sortedSiblings;
}

/**
 * returns the next tabbable descendant from the list of descendants
 * sorted by position and distance
 * if the next tabbable descendant is JSONFORM, it returns the first tabbable
 *
 * @param descendants
 * @param shiftKey
 * @returns
 */
export function getNextTabbableDescendant(
  descendants: HTMLElement[],
  shiftKey = false,
) {
  console.log({ descendants });

  const nextTabbableDescendant = descendants[0];

  // if nextTabbableDescendant is a container,
  if (nextTabbableDescendant.matches(CONTAINER_SELECTOR)) {
    const tabbableDescendants = getChildrenWidgetsOfNode(
      nextTabbableDescendant,
    );

    const {
      bottom,
      left,
      right,
      top,
    } = nextTabbableDescendant.getBoundingClientRect();

    const sortedTabbableDescendants = sortWidgetsByPosition(
      {
        top: shiftKey ? bottom : top,
        left: shiftKey ? right : left,
      },
      tabbableDescendants,
      shiftKey,
    );

    return sortedTabbableDescendants[0];
  }

  // if nextTabbableDescendant is a jsonform widget
  if (nextTabbableDescendant.matches(JSONFORM_WIDGET)) {
    const tabbable = Array.from(
      nextTabbableDescendant.querySelectorAll<HTMLElement>(FOCUS_SELECTOR),
    );

    return shiftKey ? tabbable[tabbable.length - 1] : tabbable[0];
  }

  return nextTabbableDescendant;
}

/**
 * returns a focussable element within a widget
 *
 * @param node
 * @returns
 */
export function getFocussableElementOfWidget(node: HTMLElement) {
  if (node.matches(FOCUS_SELECTOR)) {
    return node;
  }

  const focussableElement = node.querySelector(FOCUS_SELECTOR) as HTMLElement;

  return focussableElement;
}
/**
 *  get widgets of a given node
 *
 * @param node
 * @returns
 */
export function getChildrenWidgetsOfNode(node: HTMLElement) {
  const widgets = Array.from(
    node.querySelectorAll(WIDGET_SELECTOR),
  ) as HTMLElement[];

  return widgets;
}

/**
 * get the siblings of the current node's widget
 *
 * @param node
 * @returns
 */
function getWidgetSiblingsOfNode(node: HTMLElement) {
  const canvas = node.closest(CANVAS_WIDGET) as HTMLElement;

  if (!canvas) return [];

  const widget = node.closest(WIDGET_SELECTOR) as HTMLElement;
  const siblings = Array.from(
    canvas.querySelectorAll(`:scope > ${WIDGET_SELECTOR}`),
  ) as HTMLElement[];

  return siblings.filter((sibling) => sibling !== widget);
}

/**
 * sorts the descendants by their position in the DOM
 *
 * @param currentElement
 * @param tabbableDescendants
 * @param shiftKey
 * @returns
 */
export function sortWidgetsByPosition(
  boundingClientRect: {
    top: number;
    left: number;
  },
  tabbableDescendants: HTMLElement[],
  shiftKey = false,
) {
  const { left, top } = boundingClientRect;
  const isTabbingForward = !shiftKey;
  const isTabbingBackward = shiftKey;

  let tabbableElementsByPosition = Array.from(tabbableDescendants).map(
    (element) => {
      const {
        left: elementLeft,
        top: elementTop,
      } = element.getBoundingClientRect();
      const topDiff = elementTop - top;
      const leftDiff = elementLeft - left;

      return {
        element,
        topDiff,
        leftDiff,
      };
    },
  );

  tabbableElementsByPosition = tabbableElementsByPosition.filter((element) => {
    // if tabbing forward, only consider elements below and to the right
    if (isTabbingForward) {
      if (element.topDiff === 0) {
        return element.leftDiff > 0;
      }

      if (element.topDiff > 0) {
        return true;
      }

      return false;
    }

    // if tabbing backward, only consider elements above and to the left
    if (isTabbingBackward) {
      if (element.topDiff === 0) {
        return element.leftDiff < 0;
      }

      if (element.topDiff < 0) {
        return true;
      }

      return false;
    }
  });

  tabbableElementsByPosition = tabbableElementsByPosition.sort((a, b) => {
    if (isTabbingForward) {
      return a.topDiff - b.topDiff || a.leftDiff - b.leftDiff;
    }

    if (isTabbingBackward) {
      return b.topDiff - a.topDiff || b.leftDiff - a.leftDiff;
    }

    return 0;
  });

  return tabbableElementsByPosition.map((element) => element.element);
}

function hidden(element: HTMLElement) {
  return element.style.display === "none";
}

function visible(element: HTMLElement) {
  const isHidden =
    element.getAttribute("aria-hidden") ||
    element.getAttribute("hidden") ||
    element.getAttribute("type") === "hidden";

  if (isHidden) {
    return false;
  }

  let parentElement: HTMLElement = element;
  while (parentElement) {
    if (parentElement === document.body) {
      break;
    }

    if (hidden(parentElement)) {
      return false;
    }

    parentElement = parentElement.parentNode as HTMLElement;
  }

  return true;
}

export function focusable(element: HTMLElement) {
  return visible(element);
}

/**
 * get next item to focus if the current widget is json form
 *
 * Note:
 * if the user is tabbing out of the json form, we need to get the next tabbable descendant of the current widget
 * if the user is not tabbing out of the json form, we need to get the next tabbable descendant of the json form
 *
 *
 * @param currentWidget
 * @param shiftKey
 * @returns
 */
export function getNextTabbableDescendantForJSONForm(
  currentWidget: HTMLElement,
  shiftKey: boolean,
) {
  let nextTabbableDescendant;

  const tabbable = Array.from(
    currentWidget.querySelectorAll<HTMLElement>(FOCUS_SELECTOR),
  );

  const currentIndex = tabbable.indexOf(document.activeElement as HTMLElement);
  const isTabbingOutOfJSONForm = shiftKey
    ? currentIndex === 0
    : currentIndex === tabbable.length - 1;

  if (isTabbingOutOfJSONForm) {
    const descendents = getTabbableDescendants(currentWidget, shiftKey);
    nextTabbableDescendant = getNextTabbableDescendant(descendents, shiftKey);
  }

  return nextTabbableDescendant;
}
