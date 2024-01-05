import React from "react";
import ReactJson from "react-json-view";

export default function ObjectView(props: {
  value: Record<string, unknown> | unknown[];
}) {
  const reactJsonProps = {
    theme: "rjv-default",
    name: null,
    enableClipboard: false,
    displayObjectSize: false,
    displayDataTypes: false,
    style: {
      fontSize: "10px",
    },
    collapsed: 0,
    shouldCollapse: (field: any) => {
      const index = field.name * 1;
      return index >= 2;
    },
    indentWidth: 1,
  };

  return <ReactJson src={props.value} {...reactJsonProps} />;
}
