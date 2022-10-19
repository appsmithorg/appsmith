/**
 * Append PageId to path and return the key
 * @param path
 * @param currentPageId
 * @returns
 */
export function generatePropertyKey(
  path: string | undefined,
  currentPageId: string,
) {
  if (!path) return;

  return `Page[${currentPageId}].${path}`;
}

/**
 * This method returns boolean if the propertyControl is focused.
 * @param domElement
 * @returns
 */
export function shouldFocusOnPropertyControl(
  domElement?: HTMLDivElement | null,
) {
  const isCurrentFocusOnInput =
    ["input", "textarea"].indexOf(
      document.activeElement?.tagName?.toLowerCase() || "",
    ) >= 0;

  let isCurrentFocusOnProperty = false;

  if (domElement) {
    isCurrentFocusOnProperty = domElement.contains(document.activeElement);
  }

  return !(isCurrentFocusOnInput || isCurrentFocusOnProperty);
}

/**
 * Returns a focusable field of PropertyCintrol.
 * @param element
 * @returns
 */
export function getPropertyControlFocusElement(
  element: HTMLDivElement | null,
): HTMLElement | undefined {
  return element?.children?.[1]?.querySelector(
    'button:not([tabindex="-1"]), input, [tabindex]:not([tabindex="-1"])',
  ) as HTMLElement | undefined;
}
