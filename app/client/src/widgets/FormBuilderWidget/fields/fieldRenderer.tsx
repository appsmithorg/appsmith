import React from "react";
import { ControllerRenderProps } from "react-hook-form";

import { FIELD_MAP, SchemaItem } from "../constants";

const fieldRenderer = (
  fieldName: ControllerRenderProps["name"],
  schemaItem: SchemaItem,
) => {
  const { fieldType } = schemaItem;
  const FieldComponent = FIELD_MAP[fieldType];

  const fieldProps = {
    key: fieldName,
    name: fieldName,
    schemaItem,
  };

  return <FieldComponent {...fieldProps} />;
};

export default fieldRenderer;
