import { set } from "lodash";
import { useContext, useEffect } from "react";

import FormContext from "../FormContext";

const clone = require("rfdc/default");

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
