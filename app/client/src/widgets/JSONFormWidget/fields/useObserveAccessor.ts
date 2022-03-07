import { useContext, useEffect } from "react";
import { useFormContext } from "react-hook-form";

import FormContext from "../FormContext";

type UseUpdateAccessorProps = {
  accessor: string;
};

/**
 * This hook observes changes in the accessor and triggers a re-computation
 * of the formData values.
 */

function useUpdateAccessor({ accessor }: UseUpdateAccessorProps) {
  const { getValues } = useFormContext();
  const { updateFormData } = useContext(FormContext);

  useEffect(() => {
    const values = getValues();

    updateFormData(values);
  }, [accessor]);
}

export default useUpdateAccessor;
