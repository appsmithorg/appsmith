import * as Sentry from "@sentry/react";
import { set } from "lodash";
import type { ControllerProps } from "react-hook-form";
import { useFormContext } from "react-hook-form";
import { useContext, useEffect } from "react";
import { klona } from "klona";

import FormContext from "../FormContext";
import type { FieldType } from "../constants";
import { startAndEndSpanForFn } from "UITelemetry/generateTraces";

export interface UseRegisterFieldValidityProps {
  isValid: boolean;
  fieldName: ControllerProps["name"];
  fieldType: FieldType;
}
/**
 * This hook is used to register the isValid property of the field
 * the meta property "fieldState".
 * */
function useRegisterFieldValidity({
  fieldName,
  fieldType,
  isValid,
}: UseRegisterFieldValidityProps) {
  const { clearErrors, getFieldState, setError } = useFormContext();
  const { setMetaInternalFieldState } = useContext(FormContext);
  const { error } = getFieldState(fieldName);

  useEffect(() => {
    /**
     * TODO (Ashit): This setTimeout is a patch to avoid a plausible race-condition when a bunch
     * of fields are registered in ReactHookForm and internally the error is lost.
     * This needs to be further investigated.
     */
    setTimeout(() => {
      try {
        isValid
          ? startAndEndSpanForFn("JSONFormWidget.clearErrors", {}, () => {
              if (error) {
                clearErrors(fieldName);
              }
            })
          : startAndEndSpanForFn("JSONFormWidget.setError", {}, () => {
              setError(fieldName, {
                type: fieldType,
                message: "Invalid field",
              });
            });
      } catch (e) {
        Sentry.captureException(e);
      }
    }, 0);

    setMetaInternalFieldState((prevState) => {
      const metaInternalFieldState = klona(prevState.metaInternalFieldState);
      set(metaInternalFieldState, `${fieldName}.isValid`, isValid);

      return {
        ...prevState,
        metaInternalFieldState,
      };
    });
  }, [
    isValid,
    fieldName,
    fieldType,
    setMetaInternalFieldState,
    error,
    clearErrors,
    setError,
  ]);
}

export default useRegisterFieldValidity;
