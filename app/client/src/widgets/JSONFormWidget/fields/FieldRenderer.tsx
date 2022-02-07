import React from "react";
import { ControllerRenderProps } from "react-hook-form";

import { FIELD_MAP, SchemaItem } from "../constants";

type FieldRendererProps = {
  fieldName: ControllerRenderProps["name"];
  schemaItem: SchemaItem;
  propertyPath: string;
  options?: Record<string, any>;
  passedDefaultValue?: unknown;
};

function FieldRenderer({
  fieldName,
  options,
  passedDefaultValue,
  propertyPath,
  schemaItem,
}: FieldRendererProps) {
  const { fieldType, isVisible = true } = schemaItem;

  const FieldComponent = FIELD_MAP[fieldType];

  if (!isVisible) {
    return null;
  }

  if (!FieldComponent) return null;

  return (
    <FieldComponent
      fieldClassName={fieldName.replace(/[\.\[\]]/gi, "-")}
      name={fieldName} // replace [,],. with -
      passedDefaultValue={passedDefaultValue}
      propertyPath={propertyPath}
      schemaItem={schemaItem}
      {...options}
    />
  );
}

export default FieldRenderer;
