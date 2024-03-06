import React from "react";

import { useController } from "react-hook-form";

interface HiddenFieldProps {
  name: string;
  generateValue?: () => string;
}

function HiddenField({ generateValue, name }: HiddenFieldProps) {
  const { field } = useController({
    name,
  });
  const { onBlur, onChange } = field;

  const value = generateValue ? generateValue() : field.value;

  return (
    <input
      data-testid={`hiddenField-${name}`}
      onBlur={onBlur}
      onChange={onChange}
      type="hidden"
      value={value}
    />
  );
}

export default HiddenField;
