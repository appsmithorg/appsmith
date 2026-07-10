import { sanitizeTabOrder, TAB_ORDER_ATTRIBUTE } from "utils/widgetTabOrder";

export const CANVAS_WIDGET = '[type="CANVAS_WIDGET"]';
// NOTE: This is a hack to exclude the current canvas from the query selector
// because when we use.closest, it returns the current element too
export const CANVAS_WIDGET_EXCLUDING_SCOPE =
  '[type="CANVAS_WIDGET"]:not(:scope)';
export const CONTAINER_SELECTOR =
  ":is(.t--widget-containerwidget, .t--widget-formwidget)";
const NON_FOCUSABLE_WIDGET_CLASS =
  ".t--widget-textwidget, .t--widget-ratewidget, [disabled], [data-hidden]";

export const JSONFORM_WIDGET = ".t--widget-jsonformwidget";
export const MODAL_WIDGET = ".t--modal-widget";
export const CHECKBOXGROUP_WIDGET = ".t--widget-checkboxgroupwidget";
export const SWITCHGROUP_WIDGET = ".t--widget-switchgroupwidget";
export const BUTTONGROUP_WIDGET = ".t--widget-buttongroupwidget";
// NOTE: written as an expanded selector list (no :is) so it stays parseable
// by jsdom/nwsapi in unit tests; equivalent to
// :is(a, input, ...):not([data-tabbable='false'])
export const FOCUS_SELECTOR = [
  "a",
  "input",
  "select",
  "textarea",
  "button",
  "object",
  "audio",
  "video",
  "[tabindex='-1']",
]
  .map((selector) => `${selector}:not([data-tabbable='false'])`)
  .join(", ");
export const WIDGET_SELECTOR = `.positioned-widget:is(:not(${NON_FOCUSABLE_WIDGET_CLASS}))`;

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

  if (!activeWidget) {
    const modal = currentNode.closest(MODAL_WIDGET) as HTMLElement;

    // if we are in modal, we have to trap the focus within the modal
    if (modal) {
      const tabbableDescendants = Array.from(
        modal.querySelectorAll(WIDGET_SELECTOR),
      ) as HTMLElement[];

      const domRect = modal.getBoundingClientRect();

      const sortedTabbableDescendants = sortTabbableWidgets(
        {
          top: shiftKey ? domRect.bottom : domRect.top,
          left: shiftKey ? domRect.right : domRect.left,
        },
        tabbableDescendants,
        shiftKey,
      );

      return sortedTabbableDescendants;
    }

    // this case means the focus on the main container canvas
    if (currentNode.matches(CANVAS_WIDGET)) {
      const tabbableDescendants = Array.from(
        currentNode.querySelectorAll(WIDGET_SELECTOR),
      ) as HTMLElement[];

      const domRect = currentNode.getBoundingClientRect();

      const sortedTabbableDescendants = sortTabbableWidgets(
        {
          top: shiftKey ? domRect.bottom : domRect.top,
          left: shiftKey ? domRect.right : domRect.left,
        },
        tabbableDescendants,
        shiftKey,
      );

      return sortedTabbableDescendants;
    }
  }

  const siblings = getWidgetSiblingsOfNode(activeWidget);
  const domRect = activeWidget.getBoundingClientRect();

  const sortedSiblings = sortTabbableWidgets(
    {
      top: domRect.top,
      left: domRect.left,
    },
    siblings,
    shiftKey,
    activeWidget,
  );

  // Only stay in this scope if something in it can actually receive focus.
  // A trailing display-only widget (image, chart, divider...) would otherwise
  // dead-end the tab sequence: handleTab exhausts the list without focusing
  // anything and never reaches the parent-scope wrap-around below.
  const hasFocusableSibling = sortedSiblings.some((sibling) =>
    getFocussableElementOfWidget(sibling),
  );

  if (sortedSiblings.length && hasFocusableSibling) return sortedSiblings;

  // there are no (focusable) siblings, which means we are at the end of the
  // tabbable list. We have to go to next sibling widget of current canvas
  const currentCanvas = currentNode.closest(
    CANVAS_WIDGET_EXCLUDING_SCOPE,
  ) as HTMLElement;

  if (currentCanvas) {
    return getTabbableDescendants(currentCanvas, shiftKey);
  }

  return [];
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
  const nextTabbableDescendant = descendants[0];

  if (!nextTabbableDescendant) return;

  // if nextTabbableDescendant is a container,
  if (nextTabbableDescendant.matches(CONTAINER_SELECTOR)) {
    const tabbableDescendants = getChildrenWidgetsOfNode(
      nextTabbableDescendant,
    );

    const { bottom, left, right, top } =
      nextTabbableDescendant.getBoundingClientRect();

    const sortedTabbableDescendants = sortTabbableWidgets(
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
  if (
    nextTabbableDescendant.matches(JSONFORM_WIDGET) ||
    nextTabbableDescendant.matches(CHECKBOXGROUP_WIDGET) ||
    nextTabbableDescendant.matches(SWITCHGROUP_WIDGET) ||
    nextTabbableDescendant.matches(BUTTONGROUP_WIDGET)
  ) {
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

  return node.querySelector(FOCUS_SELECTOR) as HTMLElement;
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
  const canvas = node.closest(CANVAS_WIDGET_EXCLUDING_SCOPE) as HTMLElement;

  if (!canvas) return [];

  const widget = node.closest(WIDGET_SELECTOR) as HTMLElement;
  const siblings = Array.from(
    canvas.querySelectorAll(`:scope > ${WIDGET_SELECTOR}`),
  ) as HTMLElement[];

  return siblings.filter((sibling) => sibling !== widget);
}

/**
 * reads the sanitized explicit tab order of a widget element from the
 * data attribute rendered by the widget wrapper. Absent or invalid values
 * mean automatic order.
 *
 * @param element
 * @returns
 */
export function getExplicitTabOrder(element: HTMLElement): number | undefined {
  const value = element.getAttribute(TAB_ORDER_ATTRIBUTE);

  return value === null ? undefined : sanitizeTabOrder(value);
}

/**
 * sorts the widgets of the current tab scope
 *
 * When no widget in the scope has a valid explicit tabOrder, this defers to
 * sortWidgetsByPosition, preserving the automatic position-based behavior
 * exactly. When at least one widget has a valid tabOrder, the scope sequence
 * becomes: explicitly ordered widgets ascending (ties broken by position),
 * followed by the remaining widgets in automatic position order. Shift+Tab
 * walks the same sequence in reverse.
 *
 * @param boundingClientRect top/left of the element we are tabbing from
 * @param tabbableDescendants candidate widgets of the current scope
 * @param shiftKey
 * @param currentWidget the widget we are tabbing from, when it is part of the scope
 * @returns
 */
export function sortTabbableWidgets(
  boundingClientRect: {
    top: number;
    left: number;
  },
  tabbableDescendants: HTMLElement[],
  shiftKey = false,
  currentWidget?: HTMLElement | null,
): HTMLElement[] {
  const scope = currentWidget
    ? [...tabbableDescendants, currentWidget]
    : tabbableDescendants;
  const hasExplicitTabOrder = scope.some(
    (widget) => getExplicitTabOrder(widget) !== undefined,
  );

  if (!hasExplicitTabOrder) {
    return sortWidgetsByPosition(
      boundingClientRect,
      tabbableDescendants,
      shiftKey,
    );
  }

  const sequence = getTabOrderSequence(scope);

  if (currentWidget) {
    const currentIndex = sequence.indexOf(currentWidget);

    return shiftKey
      ? sequence.slice(0, currentIndex).reverse()
      : sequence.slice(currentIndex + 1);
  }

  return shiftKey ? [...sequence].reverse() : sequence;
}

/**
 * builds the full tab sequence of a scope: widgets with a valid explicit
 * tabOrder first (ascending, duplicates tie-break by position), then the
 * remaining widgets in automatic position order
 *
 * @param widgets
 * @returns
 */
function getTabOrderSequence(widgets: HTMLElement[]): HTMLElement[] {
  const byPosition = [...widgets].sort((a, b) => {
    const rectA = a.getBoundingClientRect();
    const rectB = b.getBoundingClientRect();

    return rectA.top - rectB.top || rectA.left - rectB.left;
  });

  const explicit: {
    element: HTMLElement;
    order: number;
    positionIndex: number;
  }[] = [];
  const auto: HTMLElement[] = [];

  byPosition.forEach((element, positionIndex) => {
    const order = getExplicitTabOrder(element);

    if (order === undefined) {
      auto.push(element);
    } else {
      explicit.push({ element, order, positionIndex });
    }
  });

  explicit.sort(
    (a, b) => a.order - b.order || a.positionIndex - b.positionIndex,
  );

  return [...explicit.map((entry) => entry.element), ...auto];
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
      const { left: elementLeft, top: elementTop } =
        element.getBoundingClientRect();
      const topDiff = elementTop - top;
      const leftDiff = elementLeft - left;

      return {
        element,
        topDiff,
        leftDiff,
        top,
        left,
        elementTop,
        elementLeft,
      };
    },
  );

  tabbableElementsByPosition = tabbableElementsByPosition.filter((element) => {
    // if tabbing forward, only consider elements below and to the right
    if (isTabbingForward) {
      if (element.topDiff === 0) {
        return element.leftDiff > 0;
      }

      return element.topDiff > 0;
    }

    // if tabbing backward, only consider elements above and to the left
    if (isTabbingBackward) {
      if (element.topDiff === 0) {
        return element.leftDiff < 0;
      }

      return element.topDiff < 0;
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

/**
 * get next item to focus if the current widget has relative positioned children
 *
 * Note:
 * if the user is tabbing out, we need to get the next tabbable descendant of the current widget
 * else tabbing will work as expected as widgets inside the widget are regular components
 * and will be handled by the default tabbing logic
 *
 *
 * @param currentWidget
 * @param shiftKey
 * @returns
 */
export function getNextTabbableDescendantForRegularWidgets(
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
