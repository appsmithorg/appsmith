import React from "react";
import { Field } from "redux-form";
import CodeEditor from "../CodeEditor";

const JSONEditorField = (props: { name: string }) => {
  return (
    <Field
      name={props.name}
      component={CodeEditor}
      height={500}
      language={"json"}
      format={(value: string | object) =>
        typeof value === "string" ? value : JSON.stringify(value, null, 2)
      }
      placeholder="Input post body here"
    />
  );
};

export default JSONEditorField;
