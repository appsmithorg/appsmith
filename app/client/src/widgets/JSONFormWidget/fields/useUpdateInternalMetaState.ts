import { debounce, set } from "lodash";
import { useMemo, useContext, useCallback } from "react";

import type { DebouncedExecuteActionPayload } from "widgets/MetaHOC";
import FormContext from "../FormContext";
import { klonaRegularWithTelemetry } from "utils/helpers";

export interface UseUpdateInternalMetaStateProps {
  propertyName?: string;
}

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
          const metaInternalFieldState = klonaRegularWithTelemetry(
            prevState.metaInternalFieldState,
            "useUpdateInternalMetaState.metaInternalFieldState",
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
