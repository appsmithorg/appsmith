import React from "react";
import { ControllerRenderProps, useFieldArray } from "react-hook-form";

import { SchemaObject } from "../constants";

type FieldArrayProps = {
  name: ControllerRenderProps["name"];
  schemaObject: SchemaObject;
};

function FieldArray({ name }: FieldArrayProps) {
  const { fields } = useFieldArray({
    name,
  });

  // eslint-disable-next-line
  console.log("ARRAY fields", fields);
  return <div />;
}

export default FieldArray;
