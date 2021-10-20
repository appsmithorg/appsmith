import React from "react";
import { ControllerRenderProps } from "react-hook-form";

import { FIELD_MAP, SchemaItem } from "../constants";

const fieldRenderer = (
  fieldName: ControllerRenderProps["name"],
  schemaItem: SchemaItem,
  options?: Record<string, any>,
) => {
  const { fieldType, isVisible = true, tooltip } = schemaItem;

  if (!isVisible) {
    return null;
  }

  const FieldComponent = FIELD_MAP[fieldType];

  const fieldProps = {
    key: fieldName,
    name: fieldName,
    tooltip,
    schemaItem,
  };

  return <FieldComponent {...fieldProps} {...options} />;
};

export default fieldRenderer;
