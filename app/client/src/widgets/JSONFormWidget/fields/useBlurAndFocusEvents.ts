import type { ControllerRenderProps } from "react-hook-form";
import { EventType } from "constants/AppsmithActionConstants/ActionConstants";
import { useCallback, useContext, useEffect, useRef } from "react";

import FormContext from "../FormContext";

type BaseEvents = Pick<
  HTMLInputElement,
  "onfocus" | "onblur" | "addEventListener" | "removeEventListener"
>;

type UseEventsProps = {
  fieldBlurHandler?: ControllerRenderProps["onBlur"];
  onFocusDynamicString?: string;
  onBlurDynamicString?: string;
};

function useBlurAndFocusEvents<TElement extends BaseEvents>({
  fieldBlurHandler,
  onBlurDynamicString,
  onFocusDynamicString,
}: UseEventsProps = {}) {
  const fieldBlurHandlerRef = useRef<ControllerRenderProps["onBlur"]>();
  const inputRef = useRef<TElement | null>(null);
  const { executeAction } = useContext(FormContext) || {};

  const onBlurHandler = useCallback(() => {
    if (fieldBlurHandlerRef.current) {
      fieldBlurHandlerRef.current?.();
    }

    if (fieldBlurHandler) {
      fieldBlurHandler();
    }

    if (onBlurDynamicString) {
      executeAction?.({
        triggerPropertyName: "onBlur",
        dynamicString: onBlurDynamicString,
        event: {
          type: EventType.ON_BLUR,
        },
      });
    }
  }, [executeAction, onBlurDynamicString]);

  const onFocusHandler = useCallback(() => {
    if (onFocusDynamicString) {
      executeAction?.({
        triggerPropertyName: "onFocus",
        dynamicString: onFocusDynamicString,
        event: {
          type: EventType.ON_FOCUS,
        },
      });
    }
  }, [executeAction, onFocusDynamicString]);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.addEventListener("blur", onBlurHandler);
      inputRef.current.addEventListener("focus", onFocusHandler);
    }

    return () => {
      if (inputRef.current) {
        inputRef.current.removeEventListener("blur", onBlurHandler);
        inputRef.current.removeEventListener("focus", onFocusHandler);
      }
    };
  }, [inputRef.current, onBlurHandler, onFocusHandler]);

  const registerFieldOnBlurHandler = (
    blurHandler: ControllerRenderProps["onBlur"],
  ) => {
    fieldBlurHandlerRef.current = blurHandler;
  };

  return {
    inputRef,
    onBlurHandler,
    onFocusHandler,
    registerFieldOnBlurHandler,
  };
}

export default useBlurAndFocusEvents;
