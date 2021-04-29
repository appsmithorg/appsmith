import { Position } from "@blueprintjs/core";
import Tooltip from "components/ads/Tooltip";
import { EditorTheme } from "components/editorComponents/CodeEditor/EditorConfig";
import React from "react";

type Props = {
  tooltip?: string;
  label: string;
  theme?: EditorTheme;
};

function PropertyHelpLabel(props: Props) {
  const toolTipDefined = props.tooltip !== undefined;
  if (!props.label) {
    return null;
  }
  return (
    <Tooltip
      content={props.tooltip || ""}
      disabled={!toolTipDefined}
      hoverOpenDelay={200}
      position={Position.TOP}
    >
      <div
        style={{
          height: "22px",
        }}
      >
        <label
          className={`t--property-control-label`}
          style={
            toolTipDefined
              ? {
                  cursor: "help",
                }
              : {}
          }
        >
          {props.label}
        </label>
        <span
          className={"underline"}
          style={
            toolTipDefined
              ? {
                  borderBottom: "1px dashed",
                  width: "100%",
                  display: "inline-block",
                  position: "relative",
                  top: "-15px",
                }
              : {}
          }
        />
      </div>
    </Tooltip>
  );
}

export default PropertyHelpLabel;
