import React from "react";
import { Field } from "redux-form";
import CodeEditor from "../editor/CodeEditor";

const JSONEditorField = (props: { name: string }) => {
  return (
    <Field
      name={props.name}
      component={CodeEditor}
      format={(value: string | object) =>
        typeof value === "string" ? value : JSON.stringify(value, null, 2)
      }
      placeholder="Input post body here"
    />
  );
};

export default JSONEditorField;
