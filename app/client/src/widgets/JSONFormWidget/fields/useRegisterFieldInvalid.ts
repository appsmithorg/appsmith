import { cloneDeep, set } from "lodash";
import { ControllerProps, useFormContext } from "react-hook-form";
import { useContext, useRef } from "react";

import FormContext from "../FormContext";
import { FieldType } from "../constants";

type UseRegisterFieldValidityProps = {
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
}: UseRegisterFieldValidityProps) {
  const currentIsValidRef = useRef<boolean>();
  const { clearErrors, setError } = useFormContext();
  const { setFieldValidityState } = useContext(FormContext);

  const onFieldValidityChange = (isValid: boolean) => {
    if (currentIsValidRef.current !== isValid) {
      currentIsValidRef.current = isValid;

      setTimeout(() => {
        try {
          isValid
            ? clearErrors(fieldName)
            : setError(fieldName, {
                type: fieldType,
                message: "Invalid field",
              });
        } catch (e) {}
      }, 0);

      setFieldValidityState((prevState) => {
        const fieldValidity = cloneDeep(prevState.fieldValidity);
        set(fieldValidity, `${fieldName}.isValid`, isValid);

        return {
          ...prevState,
          fieldValidity,
        };
      });
    }
  };

  return {
    onFieldValidityChange,
  };
}

export default useRegisterFieldValidity;
