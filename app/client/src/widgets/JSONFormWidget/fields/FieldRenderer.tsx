import React from "react";
import { ControllerRenderProps } from "react-hook-form";

import { FIELD_MAP, SchemaItem } from "../constants";

type FieldRendererProps = {
  fieldName: ControllerRenderProps["name"];
  options?: Record<string, any>;
  passedDefaultValue?: unknown;
  propertyPath: string;
  schemaItem: SchemaItem;
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
      fieldClassName={fieldName.replace(/[\.\[\]]/gi, "-")} // replace [,],. with -
      name={fieldName}
      passedDefaultValue={passedDefaultValue}
      propertyPath={propertyPath}
      schemaItem={schemaItem}
      {...options}
    />
  );
}

export default FieldRenderer;
