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
  const { fieldState, updateWidgetMetaProperty } = useContext(FormContext);

  const onFieldValidityChange = (isValid: boolean) => {
    if (currentIsValidRef.current !== isValid) {
      currentIsValidRef.current = isValid;

      setTimeout(() => {
        isValid
          ? clearErrors(fieldName)
          : setError(fieldName, {
              type: fieldType,
              message: "Invalid field",
            });
      }, 0);

      const newFieldState = cloneDeep(fieldState);
      set(newFieldState, `${fieldName}.isValid`, isValid);
      // Added setTimeout to resolve a race condition where in the metaHOC,
      // the old value gets updated in the meta property
      // If initially the value of isValid was true and new value false is passed
      // then the value will remain true, now if the value true is passed, metaHOC will
      // update the value as false (previous value).
      updateWidgetMetaProperty("fieldState", newFieldState);
    }
  };

  return {
    onFieldValidityChange,
  };
}

export default useRegisterFieldValidity;
