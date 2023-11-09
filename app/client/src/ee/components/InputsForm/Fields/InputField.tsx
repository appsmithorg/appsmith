import { InputText } from "components/propertyControls/InputTextControl";
import React, { useContext } from "react";

import { useController, useFormContext } from "react-hook-form";
import { InputsFormContext } from "../InputsFormContext";

interface InputFieldProps {
  name: string;
  evaluatedValueLookupPath: string;
}

function InputField({ evaluatedValueLookupPath, name }: InputFieldProps) {
  const {
    field: { onBlur, onChange, value },
  } = useController({
    name,
  });
  const { getValues } = useFormContext();
  const { useWatchEvalPath } = useContext(InputsFormContext);
  const evalKey = getValues(evaluatedValueLookupPath);

  const evaluatedValue = useWatchEvalPath?.(evalKey);

  return (
    <InputText
      enableAI={false}
      evaluatedValue={evaluatedValue}
      label=""
      onBlur={onBlur}
      onChange={onChange}
      placeholder="Default value"
      value={value}
    />
  );
}

export default InputField;
