import { useCallback, useMemo } from "react";
import { useFormContext } from "react-hook-form";
import { useSelector } from "react-redux";
import type { UseFormReturn } from "react-hook-form";

import { getModuleInputsEvalValues } from "@appsmith/selectors/modulesSelector";

function useEvalValues() {
  const useWatchEvalAndSetForm = useCallback(function useObserveEval(
    methods: UseFormReturn<any, any>,
  ) {
    const { setValue } = methods;
    const inputsEvaluatedValues = useSelector(getModuleInputsEvalValues);

    Object.entries(inputsEvaluatedValues).forEach(([key, value]) => {
      const path = `eval_inputsForm.${key}`;

      setValue(path, value);
    });
  }, []);

  const useWatchEvalPath = useCallback(function useOvserveEvalPath(
    name: string,
  ) {
    const { getValues } = useFormContext();
    const evalName = `eval_inputsForm.${name}`;

    return getValues(evalName);
  }, []);

  return useMemo(
    () => ({
      useWatchEvalAndSetForm,
      useWatchEvalPath,
    }),
    [useWatchEvalAndSetForm, useWatchEvalPath],
  );
}

export default useEvalValues;
