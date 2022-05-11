import { useEffect } from "react";
import {
  FieldPath,
  FieldValues,
  useController as useRHFController,
  UseControllerProps,
  UseControllerReturn,
} from "react-hook-form";

function useController<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>(
  props: UseControllerProps<TFieldValues, TName>,
): UseControllerReturn<TFieldValues, TName> {
  const controller = useRHFController(props);
  const {
    field: { onChange },
  } = controller;

  useEffect(() => {
    /**
     * When a component is hidden, the value of it is set to null so that
     * updating for formData is triggered and we can remove the particular field
     * from the `formData`
     *
     * Alternative solution: enable `shouldUnregister` in useRHFController which will
     * de-register in the RHF's internal formData state. There's a caveat which needs to be
     * solved before this is enabled i.e the ArrayField does not play well with this configuration.
     * Removing of one Array field item will reset all the items below it.
     */
    return () => {
      onChange(null);
    };
  }, []);

  return controller;
}

export default useController;
