import type { RefObject } from "react";
import { useRef } from "react";
import type { DSEventDetail } from "utils/AppsmithUtils";
import { emitDSEvent } from "utils/AppsmithUtils";

export default function useDSEvent<T extends HTMLElement>(
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

  function dispatchDSEvent(args: DSEventDetail) {
    if (isCallbackRef) emitDSEvent(element, args);
    else emitDSEvent(eventEmitterRef.current, args);
  }

  return {
    emitDSEvent: dispatchDSEvent,
    eventEmitterRef,
    eventEmitterRefCallback,
  };
}
