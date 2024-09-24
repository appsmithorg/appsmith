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
      width: "100%",
      overflow: "auto",
      marginTop: "10px",
      "word-break": "break-word",
    },
    collapsed: 1,
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    shouldCollapse: (field: any) => {
      const index = field.name * 1;

      return index >= 1;
    },
    indentWidth: 1,
  };

  const { model } = useContext(CustomWidgetBuilderContext);

  return <ReactJson src={model} {...reactJsonProps} />;
}
