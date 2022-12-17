import {
  getTabbableDescendants,
  getNextTabbableDescendant,
  getFocussableElementOfWidget,
  JSONFORM_WIDGET,
  WIDGET_SELECTOR,
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
      const tabbable = getTabbableDescendants(currentWidget, shiftKey);

      nextTabbableDescendant = getNextTabbableDescendant(tabbable, shiftKey);
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
