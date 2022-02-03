import React from "react";
import { ControllerRenderProps } from "react-hook-form";

import { FIELD_MAP, SchemaItem } from "../constants";

type FieldRendererProps = {
  fieldName: ControllerRenderProps["name"];
  schemaItem: SchemaItem;
  propertyPath: string;
  options?: Record<string, any>;
};

function FieldRenderer({
  fieldName,
  options,
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
      propertyPath={propertyPath}
      schemaItem={schemaItem}
      {...options}
    />
  );
}

export default FieldRenderer;
