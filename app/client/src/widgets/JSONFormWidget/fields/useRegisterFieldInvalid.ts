import { cloneDeep, set } from "lodash";
import { ControllerProps, useFormContext } from "react-hook-form";
import { useContext, useEffect, useRef } from "react";

import FormContext from "../FormContext";
import { FieldType } from "../constants";
import useDeepEffect from "utils/hooks/useDeepEffect";

type UseRegisterFieldValidityProps = {
  isValid?: boolean;
  fieldName: ControllerProps["name"];
  fieldType: FieldType;
  useNewLogic?: boolean;
};
/**
 * This hook is used to register the isValid property of the field
 * the meta property "fieldState".
 * */
function useRegisterFieldValidity({
  fieldName,
  fieldType,
  isValid,
  useNewLogic = false,
}: UseRegisterFieldValidityProps) {
  const currentIsValidRef = useRef<boolean>();
  const { clearErrors, setError } = useFormContext();
  const { setFieldValidityState } = useContext(FormContext);

  useEffect(() => {
    if (useNewLogic) {
      try {
        isValid
          ? clearErrors(fieldName)
          : setError(fieldName, {
              type: fieldType,
              message: "Invalid field",
            });
      } catch (e) {}

      setFieldValidityState((prevState) => {
        const fieldValidity = cloneDeep(prevState.fieldValidity);
        set(fieldValidity, `${fieldName}.isValid`, isValid);

        return {
          ...prevState,
          fieldValidity,
        };
      });
    }
  }, [isValid]);

  const onFieldValidityChange = (isValid: boolean) => {
    if (currentIsValidRef.current !== isValid) {
      currentIsValidRef.current = isValid;

      try {
        isValid
          ? clearErrors(fieldName)
          : setError(fieldName, {
              type: fieldType,
              message: "Invalid field",
            });
      } catch (e) {}

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
