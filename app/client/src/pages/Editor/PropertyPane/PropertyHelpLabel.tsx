import { Position } from "@blueprintjs/core";
import Tooltip from "components/ads/Tooltip";
import { EditorTheme } from "components/editorComponents/CodeEditor/EditorConfig";
import React from "react";

type Props = {
  tooltip?: string;
  label: string;
  theme?: EditorTheme;
};

const PropertyHelpLabel = (props: Props) => {
  const toolTipDefined = props.tooltip !== undefined;
  if (!props.label) {
    return <></>;
  }
  return (
    <Tooltip
      disabled={!toolTipDefined}
      content={props.tooltip || ""}
      position={Position.TOP}
      hoverOpenDelay={200}
    >
      <div
        style={{
          height: "22px",
        }}
      >
        <label
          style={
            toolTipDefined
              ? {
                  cursor: "help",
                }
              : {}
          }
          className={`t--property-control-label`}
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
};

export default PropertyHelpLabel;
