import React from "react";

import { FIELD_MAP, SchemaItem, FieldType } from "../constants";

const fieldRenderer = (fieldName: string, schemaItem: SchemaItem) => {
  const { fieldType } = schemaItem;
  const FieldComponent = FIELD_MAP[fieldType];

  const fieldProps = {
    key: fieldName,
    name: fieldName,
  };

  return <FieldComponent {...fieldProps} schemaItem={schemaItem} />;
};

export default fieldRenderer;
