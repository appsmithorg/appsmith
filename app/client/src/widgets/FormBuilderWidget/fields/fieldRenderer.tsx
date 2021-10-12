import React from "react";

import { FIELD_MAP, SchemaObject, FieldType } from "../constants";

const fieldRenderer = (fieldName: string, schemaObject: SchemaObject) => {
  const { children, config, fieldType } = schemaObject;
  const { defaultProps, fieldComponent: FieldComponent } = FIELD_MAP[fieldType];

  const fieldProps = {
    ...defaultProps,
    ...config.props,
    key: fieldName,
    name: fieldName,
    schema: children,
  };

  switch (fieldType) {
    case FieldType.OBJECT:
    case FieldType.ARRAY:
      return <FieldComponent {...fieldProps} schemaObject={schemaObject} />;
    default:
      return <FieldComponent {...fieldProps} />;
  }
};

export default fieldRenderer;
