import { ControllerRenderProps } from "react-hook-form";
import { EventType } from "constants/AppsmithActionConstants/ActionConstants";
import { useContext, useEffect, useRef } from "react";

import FormContext from "../FormContext";

type BaseEvents = Pick<
  HTMLInputElement,
  "onfocus" | "onblur" | "addEventListener" | "removeEventListener"
>;

type UseEventsProps = {
  onFocusHandler?: string;
  onBlurHandler?: string;
};

function useEvents<TElement extends BaseEvents>({
  onBlurHandler,
  onFocusHandler,
}: UseEventsProps = {}) {
  const FieldBlurHandlerRef = useRef<ControllerRenderProps["onBlur"]>();
  const inputRef = useRef<TElement | null>();
  const { executeAction } = useContext(FormContext) || {};

  useEffect(() => {
    const onBlur = () => {
      if (FieldBlurHandlerRef.current) {
        FieldBlurHandlerRef.current?.();
      }
      if (onBlurHandler) {
        executeAction?.({
          triggerPropertyName: "onBlur",
          dynamicString: onBlurHandler,
          event: {
            type: EventType.ON_BLUR,
          },
        });
      }
    };

    const onFocus = () => {
      if (onFocusHandler) {
        executeAction?.({
          triggerPropertyName: "onFocus",
          dynamicString: onFocusHandler,
          event: {
            type: EventType.ON_FOCUS,
          },
        });
      }
    };

    if (inputRef.current) {
      inputRef.current.addEventListener("blur", onBlur);
      inputRef.current.addEventListener("focus", onFocus);
    }

    return () => {
      if (inputRef.current) {
        inputRef.current.removeEventListener("blur", onBlur);
        inputRef.current.removeEventListener("focus", onFocus);
      }
    };
  }, [inputRef.current, executeAction, onBlurHandler, onFocusHandler]);

  const registerFieldOnBlurHandler = (
    blurHandler: ControllerRenderProps["onBlur"],
  ) => {
    FieldBlurHandlerRef.current = blurHandler;
  };

  return {
    inputRef,
    registerFieldOnBlurHandler,
  };
}

export default useEvents;
