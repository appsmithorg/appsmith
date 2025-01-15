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
export const FOCUS_SELECTOR =
  ":is(a, input, select, textarea, button, object, audio, video, [tabindex='-1']):not([data-tabbable='false'])";
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
      );

      const domRect = modal.getBoundingClientRect();

      const sortedTabbableDescendants = sortWidgetsByPosition(
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
      );

      const domRect = currentNode.getBoundingClientRect();

      const sortedTabbableDescendants = sortWidgetsByPosition(
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

  const sortedSiblings = sortWidgetsByPosition(
    {
      top: domRect.top,
      left: domRect.left,
    },
    siblings,
    shiftKey,
  );

  if (sortedSiblings.length) return sortedSiblings;

  // there are no siblings, which means we are at the end of the tabbable list
  // we have to go to next sibling widget of current canvas
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
  );

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
  );

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
