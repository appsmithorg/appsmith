import * as Sentry from "@sentry/react";
import { cloneDeep, set } from "lodash";
import { ControllerProps, useFormContext } from "react-hook-form";
import { useContext, useEffect } from "react";

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
  const { setFieldValidityState } = useContext(FormContext);

  useEffect(() => {
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

    setFieldValidityState((prevState) => {
      const fieldValidity = cloneDeep(prevState.fieldValidity);
      set(fieldValidity, `${fieldName}.isValid`, isValid);

      return {
        ...prevState,
        fieldValidity,
      };
    });
  }, [isValid, fieldName, fieldType]);
}

export default useRegisterFieldValidity;
