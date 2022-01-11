import React from "react";
import { ControllerRenderProps } from "react-hook-form";

import { FIELD_MAP, SchemaItem } from "../constants";

const fieldRenderer = (
  fieldName: ControllerRenderProps["name"],
  schemaItem: SchemaItem,
  propertyPath: string,
  options?: Record<string, any>,
) => {
  const { fieldType, isVisible = true, tooltip } = schemaItem;

  if (!isVisible) {
    return null;
  }

  const FieldComponent = FIELD_MAP[fieldType];

  if (!FieldComponent) return null;

  const fieldProps = {
    key: fieldName,
    name: fieldName,
    fieldClassName: fieldName.replace(/[\.\[\]]/gi, "-"), // replace [,],. with -
    tooltip,
    schemaItem,
    propertyPath,
  };

  return <FieldComponent {...fieldProps} {...options} />;
};

export default fieldRenderer;
