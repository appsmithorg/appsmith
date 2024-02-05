import type { FieldEntityInformation } from "components/editorComponents/CodeEditor/EditorConfig";
import { InputText } from "components/propertyControls/InputTextControl";
import React from "react";

import { useController } from "react-hook-form";

interface InputFieldProps {
  name: string;
  evaluatedValue: unknown;
  dataTreePath?: string;
  blockCompletions?: FieldEntityInformation["blockCompletions"];
}

function InputField({
  blockCompletions,
  dataTreePath,
  evaluatedValue,
  name,
}: InputFieldProps) {
  const {
    field: { onBlur, onChange, value },
  } = useController({
    name,
  });

  return (
    <InputText
      blockCompletions={blockCompletions}
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
