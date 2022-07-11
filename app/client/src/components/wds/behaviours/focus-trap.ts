import {
  getFocusableChild,
  isTabbable,
} from "../utils/iterate-focusable-elements";
import { polyfill as eventListenerSignalPolyfill } from "../polyfills/event-listener-signal";

eventListenerSignalPolyfill();

interface FocusTrapMetadata {
  container: HTMLElement;
  controller: AbortController;
  initialFocus?: HTMLElement;
  originalSignal: AbortSignal;
}

const suspendedTrapStack: FocusTrapMetadata[] = [];
let activeTrap: FocusTrapMetadata | undefined = undefined;

function tryReactivate() {
  const trapToReactivate = suspendedTrapStack.pop();
  if (trapToReactivate) {
    focusTrap(
      trapToReactivate.container,
      trapToReactivate.initialFocus,
      trapToReactivate.originalSignal,
    );
  }
}

// @todo If AbortController.prototype.follow is ever implemented, that
// could replace this function. @see https://github.com/whatwg/dom/issues/920
function followSignal(signal: AbortSignal): AbortController {
  const controller = new AbortController();
  signal.addEventListener("abort", () => {
    controller.abort();
  });
  return controller;
}

/**
 * Traps focus within the given container
 * @param container The container in which to trap focus
 * @param initialFocus The element to focus when the trap is enabled
 * @param abortSignal An AbortSignal to control the focus trap
 */
export function focusTrap(
  container: HTMLElement,
  initialFocus?: HTMLElement,
  abortSignal?: AbortSignal,
): AbortController | undefined {
  // Set up an abort controller if a signal was not passed in
  const controller = new AbortController();
  const signal = abortSignal ?? controller.signal;

  container.setAttribute("data-focus-trap", "active");
  const sentinelStart = document.createElement("span");
  sentinelStart.setAttribute("class", "sentinel");
  sentinelStart.setAttribute("tabindex", "0");
  sentinelStart.setAttribute("aria-hidden", "true");
  sentinelStart.onfocus = () => {
    const lastFocusableChild = getFocusableChild(container, true);
    lastFocusableChild?.focus();
  };

  const sentinelEnd = document.createElement("span");
  sentinelEnd.setAttribute("class", "sentinel");
  sentinelEnd.setAttribute("tabindex", "0");
  sentinelEnd.setAttribute("aria-hidden", "true");
  sentinelEnd.onfocus = () => {
    // If the end sentinel was focused, move focus to the start
    const firstFocusableChild = getFocusableChild(container);
    firstFocusableChild?.focus();
  };
  container.prepend(sentinelStart);
  container.append(sentinelEnd);

  let lastFocusedChild: HTMLElement | undefined = undefined;
  // Ensure focus remains in the trap zone by checking that a given recently-focused
  // element is inside the trap zone. If it isn't, redirect focus to a suitable
  // element within the trap zone. If need to redirect focus and a suitable element
  // is not found, focus the container.
  function ensureTrapZoneHasFocus(focusedElement: EventTarget | null) {
    if (focusedElement instanceof HTMLElement && document.contains(container)) {
      if (container.contains(focusedElement)) {
        // If a child of the trap zone was focused, remember it
        lastFocusedChild = focusedElement;
        return;
      } else {
        if (
          lastFocusedChild &&
          isTabbable(lastFocusedChild) &&
          container.contains(lastFocusedChild)
        ) {
          lastFocusedChild.focus();
          return;
        } else if (initialFocus && container.contains(initialFocus)) {
          initialFocus.focus();
          return;
        } else {
          const firstFocusableChild = getFocusableChild(container);
          firstFocusableChild?.focus();
          return;
        }
      }
    }
  }

  const wrappingController = followSignal(signal);

  if (activeTrap) {
    const suspendedTrap = activeTrap;
    activeTrap.container.setAttribute("data-focus-trap", "suspended");
    activeTrap.controller.abort();
    suspendedTrapStack.push(suspendedTrap);
  }

  // When this trap is canceled, either by the user or by us for suspension
  wrappingController.signal.addEventListener("abort", () => {
    activeTrap = undefined;
  });

  // Only when user-canceled
  signal.addEventListener("abort", () => {
    container.removeAttribute("data-focus-trap");
    const sentinels = container.getElementsByClassName("sentinel");
    while (sentinels.length > 0) sentinels[0].remove();
    const suspendedTrapIndex = suspendedTrapStack.findIndex(
      (t) => t.container === container,
    );
    if (suspendedTrapIndex >= 0) {
      suspendedTrapStack.splice(suspendedTrapIndex, 1);
    }
    tryReactivate();
  });

  // Prevent focus leaving the trap container
  document.addEventListener(
    "focus",
    (event) => {
      ensureTrapZoneHasFocus(event.target);
    },
    // use capture to ensure we get all events.  focus events do not bubble
    { signal: wrappingController.signal, capture: true },
  );

  // focus the first element
  ensureTrapZoneHasFocus(document.activeElement);

  activeTrap = {
    container,
    controller: wrappingController,
    initialFocus,
    originalSignal: signal,
  };

  // If we are activating a focus trap for a container that was previously
  // suspended, just remove it from the suspended list
  const suspendedTrapIndex = suspendedTrapStack.findIndex(
    (t) => t.container === container,
  );
  if (suspendedTrapIndex >= 0) {
    suspendedTrapStack.splice(suspendedTrapIndex, 1);
  }
  if (!abortSignal) {
    return controller;
  }
}
