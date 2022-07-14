import { RefObject, useRef } from "react";
import { emitInteractionAnalyticsEvent } from "utils/AppsmithUtils";

export default function useInteractionAnalyticsEvent<T extends HTMLElement>(
  isCallbackRef = false,
  ref?: React.RefObject<T>,
) {
  let eventEmitterRef: RefObject<T>;
  let element: T | null = null;
  const internalRef = useRef<T>(null);
  const eventEmitterRefCallback = (elm: T | null) => {
    element = elm;
  };

  if (ref) {
    eventEmitterRef = ref;
  } else {
    eventEmitterRef = internalRef;
  }

  function dispatchInteractionAnalyticsEvent(args: Record<string, unknown>) {
    if (isCallbackRef) emitInteractionAnalyticsEvent(element, args);
    else emitInteractionAnalyticsEvent(eventEmitterRef.current, args);
  }

  return {
    dispatchInteractionAnalyticsEvent,
    eventEmitterRef,
    eventEmitterRefCallback,
  };
}
