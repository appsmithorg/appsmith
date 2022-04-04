import { set } from "lodash";
import { useContext, useEffect } from "react";

import FormContext from "../FormContext";

import { klona as clone } from "klona/full";

export type UseUpdateInternalMetaStateProps = {
  propertyName?: string;
  propertyValue?: string | number;
};

function useUpdateInternalMetaState({
  propertyName,
  propertyValue,
}: UseUpdateInternalMetaStateProps) {
  const { setMetaInternalFieldState } = useContext(FormContext);

  useEffect(() => {
    if (propertyName) {
      setMetaInternalFieldState((prevState) => {
        const metaInternalFieldState = clone(prevState.metaInternalFieldState);
        set(metaInternalFieldState, propertyName, propertyValue);

        return {
          ...prevState,
          metaInternalFieldState,
        };
      });
    }
  }, [propertyName, propertyValue, setMetaInternalFieldState]);
}

export default useUpdateInternalMetaState;
