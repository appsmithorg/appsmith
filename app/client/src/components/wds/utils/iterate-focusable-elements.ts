/**
 * Options to the focusable elements iterator
 */
export interface IterateFocusableElements {
  /**
   * (Default: false) Iterate through focusable elements in reverse-order
   */
  reverse?: boolean;

  /**
   * (Default: false) Perform additional checks to determine tabbability
   * which may adversely affect app performance.
   */
  strict?: boolean;

  /**
   * (Default: false) Only iterate tabbable elements, which is the subset
   * of focusable elements that are part of the page's tab sequence.
   */
  onlyTabbable?: boolean;
}

/**
 * Returns an iterator over all of the focusable elements within `container`.
 * Note: If `container` is itself focusable it will be included in the results.
 * @param container The container over which to find focusable elements.
 * @param reverse If true, iterate backwards through focusable elements.
 */
export function* iterateFocusableElements(
  container: HTMLElement,
  options: IterateFocusableElements = {},
): Generator<HTMLElement, undefined, undefined> {
  const strict = options.strict ?? false;
  const acceptFn = options.onlyTabbable ?? false ? isTabbable : isFocusable;
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_ELEMENT, {
    acceptNode: (node) =>
      node instanceof HTMLElement && acceptFn(node, strict)
        ? NodeFilter.FILTER_ACCEPT
        : NodeFilter.FILTER_SKIP,
  });
  let nextNode: Node | null = null;

  // Allow the container to participate
  if (!options.reverse && acceptFn(container, strict)) {
    yield container;
  }

  // If iterating in reverse, continue traversing down into the last child until we reach
  // a leaf DOM node
  if (options.reverse) {
    let lastChild = walker.lastChild();
    while (lastChild) {
      nextNode = lastChild;
      lastChild = walker.lastChild();
    }
  } else {
    nextNode = walker.firstChild();
  }
  while (nextNode instanceof HTMLElement) {
    yield nextNode;
    nextNode = options.reverse ? walker.previousNode() : walker.nextNode();
  }

  // Allow the container to participate (in reverse)
  if (options.reverse && acceptFn(container, strict)) {
    yield container;
  }

  return undefined;
}

/**
 * Returns the first focusable child of `container`. If `lastChild` is true,
 * returns the last focusable child of `container`.
 * @param container
 * @param lastChild
 */
export function getFocusableChild(container: HTMLElement, lastChild = false) {
  return iterateFocusableElements(container, {
    reverse: lastChild,
    strict: true,
    onlyTabbable: true,
  }).next().value;
}

/**
 * Determines whether the given element is focusable. If `strict` is true, we may
 * perform additional checks that require a reflow (less performant).
 * @param elem
 * @param strict
 */
export function isFocusable(elem: HTMLElement, strict = false): boolean {
  // Certain conditions cause an element to never be focusable, even if they have tabindex="0"
  const disabledAttrInert =
    [
      "BUTTON",
      "INPUT",
      "SELECT",
      "TEXTAREA",
      "OPTGROUP",
      "OPTION",
      "FIELDSET",
    ].includes(elem.tagName) &&
    (elem as HTMLElement & { disabled: boolean }).disabled;
  const hiddenInert = elem.hidden;
  const hiddenInputInert =
    elem instanceof HTMLInputElement && elem.type === "hidden";
  const sentinelInert = elem.classList.contains("sentinel");
  if (disabledAttrInert || hiddenInert || hiddenInputInert || sentinelInert) {
    return false;
  }

  // Each of the conditions checked below require a reflow, thus are gated by the `strict`
  // argument. If any are true, the element is not focusable, even if tabindex is set.
  if (strict) {
    const sizeInert = elem.offsetWidth === 0 || elem.offsetHeight === 0;
    const visibilityInert = ["hidden", "collapse"].includes(
      getComputedStyle(elem).visibility,
    );
    const clientRectsInert = elem.getClientRects().length === 0;
    if (sizeInert || visibilityInert || clientRectsInert) {
      return false;
    }
  }

  // Any element with `tabindex` explicitly set can be focusable, even if it's set to "-1"
  if (elem.getAttribute("tabindex") != null) {
    return true;
  }

  // One last way `elem.tabIndex` can be wrong.
  if (elem instanceof HTMLAnchorElement && elem.getAttribute("href") == null) {
    return false;
  }

  return elem.tabIndex !== -1;
}

/**
 * Determines whether the given element is tabbable. If `strict` is true, we may
 * perform additional checks that require a reflow (less performant). This check
 * ensures that the element is focusable and that its tabindex is not explicitly
 * set to "-1" (which makes it focusable, but removes it from the tab order).
 * @param elem
 * @param strict
 */
export function isTabbable(elem: HTMLElement, strict = false): boolean {
  return isFocusable(elem, strict) && elem.getAttribute("tabindex") !== "-1";
}
