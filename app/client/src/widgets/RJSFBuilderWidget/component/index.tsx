import React from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { FormBuilder } from "@ginkgo-bioworks/react-json-schema-form-builder";
import type { ComponentProps } from "widgets/BaseComponent";

function RJSFBuilderComponent(props: RJSFBuilderComponentProps) {
  const { onChange, schema: initSchema, uischema: initUischema } = props;

  return (
    <FormBuilder
      onChange={onChange}
      schema={initSchema}
      uischema={initUischema}
    />
  );
}

export interface RJSFBuilderComponentProps extends ComponentProps {
  schema: any;
  uischema: any;
  onChange: (newSchema: string, newUiSchema: string) => void;
}

export default RJSFBuilderComponent;
