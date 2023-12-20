import { InputText } from "components/propertyControls/InputTextControl";
import React from "react";

import { useController } from "react-hook-form";

interface InputFieldProps {
  name: string;
  evaluatedValue: unknown;
  dataTreePath?: string;
}

function InputField({ dataTreePath, evaluatedValue, name }: InputFieldProps) {
  const {
    field: { onBlur, onChange, value },
  } = useController({
    name,
  });

  return (
    <InputText
      dataTreePath={dataTreePath}
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
