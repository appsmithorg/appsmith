import { RefObject, useRef } from "react";
import { AdsEventDetail, emitAdsEvent } from "utils/AppsmithUtils";

export default function useAdsEvent<T extends HTMLElement>(
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

  function dispatchAdsEvent(args: AdsEventDetail) {
    if (isCallbackRef) emitAdsEvent(element, args);
    else emitAdsEvent(eventEmitterRef.current, args);
  }

  return {
    dispatchAdsEvent,
    eventEmitterRef,
    eventEmitterRefCallback,
  };
}
