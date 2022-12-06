import {
  getTabbableDescendants,
  getNextTabbableDescendant,
  getFocussableElementOfWidget,
  CANVAS_WIDGET,
  JSONFORM_WIDGET,
  WIDGET_SELECTOR,
  FOCUS_SELECTOR,
} from "./tabbable";

export function scopeTab(event: KeyboardEvent) {
  let nextTabbableDescendant;
  const shiftKey = event.shiftKey;
  const currentNode = event.target as HTMLElement;

  const currentWidget = currentNode.closest(WIDGET_SELECTOR) as HTMLElement;

  if (currentWidget.matches(JSONFORM_WIDGET)) {
    const tabbable = Array.from(
      currentWidget.querySelectorAll<HTMLElement>(FOCUS_SELECTOR),
    );

    const currentIndex = tabbable.indexOf(
      document.activeElement as HTMLElement,
    );
    const isTabbingOut = shiftKey
      ? currentIndex === 0
      : currentIndex === tabbable.length - 1;

    if (isTabbingOut) {
      const descendents = getTabbableDescendants(currentWidget, shiftKey);
      nextTabbableDescendant = getNextTabbableDescendant(descendents, shiftKey);
    }
  } else {
    const tabbable = getTabbableDescendants(currentNode, shiftKey);

    // if there are no tabbable descendants, which means we have reached the end,
    // we need to focus on the next item which is a sibling of the current container
    if (tabbable.length === 0) {
      const currentCanvas = currentNode.closest(CANVAS_WIDGET)
        ?.parentElement as HTMLElement;

      if (currentCanvas) {
        const descendents = getTabbableDescendants(currentCanvas, shiftKey);
        nextTabbableDescendant = getNextTabbableDescendant(
          descendents,
          shiftKey,
        );
      }
    } else {
      nextTabbableDescendant = getNextTabbableDescendant(tabbable, shiftKey);
    }
  }

  if (nextTabbableDescendant) {
    event.preventDefault();

    const focusableElement = getFocussableElementOfWidget(
      nextTabbableDescendant,
    );

    if (focusableElement) {
      focusableElement.focus();
    }
  }
}
