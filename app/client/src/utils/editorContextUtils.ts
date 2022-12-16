export function isCurrentFocusOnInput() {
  return (
    ["input", "textarea"].indexOf(
      document.activeElement?.tagName?.toLowerCase() || "",
    ) >= 0
  );
}

/**
 * This method returns boolean if the propertyControl is focused.
 * @param domElement
 * @returns
 */
export function shouldFocusOnPropertyControl(
  domElement?: HTMLDivElement | null,
) {
  let isCurrentFocusOnProperty = false;

  if (domElement) {
    isCurrentFocusOnProperty = domElement.contains(document.activeElement);
  }

  return !(isCurrentFocusOnInput() || isCurrentFocusOnProperty);
}

/**
 * Returns a focusable field of PropertyControl.
 * @param element
 * @returns
 */
export function getPropertyControlFocusElement(
  element: HTMLDivElement | null,
): HTMLElement | undefined {
  if (element?.children) {
    const [, propertyInputElement] = element.children;

    if (propertyInputElement) {
      const uiInputElement = propertyInputElement.querySelector(
        'button:not([tabindex="-1"]), input, [tabindex]:not([tabindex="-1"])',
      ) as HTMLElement | undefined;
      if (uiInputElement) {
        return uiInputElement;
      }
      const codeEditorInputElement = propertyInputElement.getElementsByClassName(
        "CodeEditorTarget",
      )[0] as HTMLElement | undefined;
      if (codeEditorInputElement) {
        return codeEditorInputElement;
      }

      const lazyCodeEditorInputElement = propertyInputElement.getElementsByClassName(
        "LazyCodeEditor",
      )[0] as HTMLElement | undefined;
      if (lazyCodeEditorInputElement) {
        return lazyCodeEditorInputElement;
      }
    }
  }
}
