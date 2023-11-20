import React, { useContext } from "react";
import ReactJson from "react-json-view";
import { CustomWidgetBuilderContext } from "../..";

export default function ModelVariables() {
  const reactJsonProps = {
    theme: "rjv-default",
    name: null,
    enableClipboard: false,
    displayObjectSize: false,
    displayDataTypes: false,
    style: {
      fontSize: "12px",
    },
    collapsed: 2,
    shouldCollapse: (field: any) => {
      const index = field.name * 1;
      return index >= 2;
    },
    indentWidth: 2,
  };

  const { model } = useContext(CustomWidgetBuilderContext);

  return <ReactJson src={model} {...reactJsonProps} />;
}
