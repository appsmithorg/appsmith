import { debounce, set } from "lodash";
import { useMemo, useContext, useCallback } from "react";
import { klona } from "klona";
import FormContext from "../FormContext";
import { DebouncedExecuteActionPayload } from "../../BaseWidget";

export type UseUpdateInternalMetaStateProps = {
  propertyName?: string;
};

const DEBOUNCE_TIMEOUT = 100;

function useUpdateInternalMetaState({
  propertyName,
}: UseUpdateInternalMetaStateProps) {
  const { setMetaInternalFieldState } = useContext(FormContext);

  const updateProperty = useCallback(
    (
      propertyValue: unknown,
      afterUpdateAction?: DebouncedExecuteActionPayload,
    ) => {
      if (propertyName) {
        setMetaInternalFieldState((prevState) => {
          const metaInternalFieldState = klona(
            prevState.metaInternalFieldState,
          );
          set(metaInternalFieldState, propertyName, propertyValue);

          return {
            ...prevState,
            metaInternalFieldState,
          };
        }, afterUpdateAction);
      }
    },
    [setMetaInternalFieldState, propertyName],
  );

  const debouncedUpdateProperty = useMemo(
    () => debounce(updateProperty, DEBOUNCE_TIMEOUT),
    [updateProperty],
  );

  return [debouncedUpdateProperty];
}

export default useUpdateInternalMetaState;
