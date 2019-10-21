import React from "react";
import { Field } from "redux-form";
import JSONEditor from "../editor/JSONEditor";

const JSONEditorField = (props: { name: string }) => {
  return (
    <Field
      name={props.name}
      component={JSONEditor}
      format={(value: string | object) =>
        typeof value === "string" ? value : JSON.stringify(value)
      }
    />
  );
};

export default JSONEditorField;
