import React from "react";
import { focusTrap } from "../behaviours/focus-trap";
import { useProvidedRefOrCreate } from "./useProvidedRefOrCreate";

export interface FocusTrapHookSettings {
  /**
   * Ref that will be used for the trapping container. If not provided, one will
   * be created by this hook and returned.
   */
  containerRef?: React.RefObject<HTMLElement>;

  /**
   * Ref for the element that should receive focus when the focus trap is first enabled. If
   * not provided, one will be created by this hook and returned. Its use is optional.
   */
  initialFocusRef?: React.RefObject<HTMLElement>;

  /**
   * Set to true to disable the focus trap and clean up listeners. Can be re-enabled at
   * any time.
   */
  disabled?: boolean;

  /**
   * If true, when this focus trap is cleaned up, restore focus to the element that had
   * focus immediately before the focus trap was enabled. (Default: false)
   */
  restoreFocusOnCleanUp?: boolean;
}

/**
 * Hook used to trap focus inside a container. Returns a ref that can be added to the container
 * that should trap focus.
 * @param settings {FocusTrapHookSettings}
 */
export function useFocusTrap(
  settings?: FocusTrapHookSettings,
  dependencies: React.DependencyList = [],
): {
  containerRef: React.RefObject<HTMLElement>;
  initialFocusRef: React.RefObject<HTMLElement>;
} {
  const containerRef = useProvidedRefOrCreate(settings?.containerRef);
  const initialFocusRef = useProvidedRefOrCreate(settings?.initialFocusRef);
  const disabled = settings?.disabled;
  const abortController = React.useRef<AbortController>();
  const previousFocusedElement = React.useRef<Element | null>(null);

  // If we are enabling a focus trap and haven't already stored the previously focused element
  // go ahead an do that so we can restore later when the trap is disabled.
  if (!previousFocusedElement.current && !settings?.disabled) {
    previousFocusedElement.current = document.activeElement;
  }

  // This function removes the event listeners that enable the focus trap and restores focus
  // to the previously-focused element (if necessary).
  function disableTrap() {
    abortController.current?.abort();
    if (
      settings?.restoreFocusOnCleanUp &&
      previousFocusedElement.current instanceof HTMLElement
    ) {
      previousFocusedElement.current.focus();
      previousFocusedElement.current = null;
    }
  }

  React.useEffect(
    () => {
      if (containerRef.current instanceof HTMLElement) {
        if (!disabled) {
          abortController.current = focusTrap(
            containerRef.current,
            initialFocusRef.current ?? undefined,
          );
          return () => {
            disableTrap();
          };
        } else {
          disableTrap();
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [containerRef, initialFocusRef, disabled, ...dependencies],
  );

  return { containerRef, initialFocusRef };
}
