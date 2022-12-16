import {
  getTabbableDescendants,
  getNextTabbableDescendant,
  getFocussableElementOfWidget,
  CANVAS_WIDGET,
  JSONFORM_WIDGET,
  WIDGET_SELECTOR,
  FOCUS_SELECTOR,
  getNextTabbableDescendantForJSONForm,
  CHECKBOXGROUP_WIDGET,
} from "./tabbable";

export function scopeTab(event: KeyboardEvent) {
  let nextTabbableDescendant;
  const shiftKey = event.shiftKey;
  const currentNode = event.target as HTMLElement;

  const currentWidget = currentNode.closest(WIDGET_SELECTOR) as HTMLElement;

  switch (true) {
    case currentWidget.matches(JSONFORM_WIDGET):
    case currentWidget.matches(CHECKBOXGROUP_WIDGET):
      nextTabbableDescendant = getNextTabbableDescendantForJSONForm(
        currentWidget,
        shiftKey,
      );
      break;
    default:
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

  console.log({ nextTabbableDescendant });

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
