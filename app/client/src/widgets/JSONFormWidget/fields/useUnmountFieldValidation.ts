import { useEffect } from "react";
import { useFormContext } from "react-hook-form";
import type { ControllerProps } from "react-hook-form";
import { startAndEndSpanForFn } from "instrumentation/generateTraces";

export interface UseUnmountFieldValidationProps {
  fieldName: ControllerProps["name"];
}

/**
 * This hook triggers validation for a field when it unmounts
 * Useful for validating fields that become hidden/removed
 * https://github.com/appsmithorg/appsmith/issues/28018
 */
function useUnmountFieldValidation({
  fieldName,
}: UseUnmountFieldValidationProps) {
  const { trigger } = useFormContext();

  useEffect(() => {
    return () => {
      startAndEndSpanForFn("JSONFormWidget.triggerFieldValidation", {}, () => {
        trigger(fieldName);
      });
    };
  }, [fieldName, trigger]);
}

export default useUnmountFieldValidation;
