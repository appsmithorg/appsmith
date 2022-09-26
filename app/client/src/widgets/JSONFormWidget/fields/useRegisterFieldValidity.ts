import * as Sentry from "@sentry/react";
import { set } from "lodash";
import { ControllerProps, useFormContext } from "react-hook-form";
import { useContext, useEffect } from "react";
import { klona } from "klona";

import FormContext from "../FormContext";
import { FieldType } from "../constants";

export type UseRegisterFieldValidityProps = {
  isValid: boolean;
  fieldName: ControllerProps["name"];
  fieldType: FieldType;
};
/**
 * This hook is used to register the isValid property of the field
 * the meta property "fieldState".
 * */
function useRegisterFieldValidity({
  fieldName,
  fieldType,
  isValid,
}: UseRegisterFieldValidityProps) {
  const { clearErrors, setError } = useFormContext();
  const { setMetaInternalFieldState } = useContext(FormContext);

  useEffect(() => {
    /**
     * TODO (Ashit): This setTimeout is a patch to avoid a plausible race-condition when a bunch
     * of fields are registered in ReactHookForm and internally the error is lost.
     * This needs to be further investigated.
     */
    setTimeout(() => {
      try {
        isValid
          ? clearErrors(fieldName)
          : setError(fieldName, {
              type: fieldType,
              message: "Invalid field",
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
  }, [isValid, fieldName, fieldType]);
}

export default useRegisterFieldValidity;
