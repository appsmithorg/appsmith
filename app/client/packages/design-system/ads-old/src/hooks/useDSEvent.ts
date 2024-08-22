import type { RefObject } from "react";
import { useRef } from "react";
import type { DSEventTypes } from "../types/common";
import { DS_EVENT } from "../types/common";

interface DSEventDetail {
  component: string;
  event: DSEventTypes;
  meta: Record<string, unknown>;
}

function createDSEvent(detail: DSEventDetail) {
  return new CustomEvent(DS_EVENT, {
    bubbles: true,
    detail,
  });
}

function emitDSEvent<T extends HTMLElement>(
  element: T | null,
  args: DSEventDetail,
) {
  element?.dispatchEvent(createDSEvent(args));
}

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
