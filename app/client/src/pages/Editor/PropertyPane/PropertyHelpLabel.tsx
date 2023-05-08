import { TooltipComponent as Tooltip } from "design-system-old";
import type { EditorTheme } from "components/editorComponents/CodeEditor/EditorConfig";
import React from "react";

type Props = {
  className?: string;
  tooltip?: string;
  label: string;
  theme?: EditorTheme;
  maxWidth?: string;
  lineHeight?: string;
};

function PropertyHelpLabel(props: Props) {
  const toolTipDefined = props.tooltip !== undefined;
  if (!props.label) {
    return null;
  }
  return (
    <Tooltip
      content={
        <div
          style={{
            color: "#FAFAFA",
            maxWidth: props.maxWidth ? props.maxWidth : "320px",
            lineHeight: props.lineHeight,
          }}
        >
          {props.tooltip || ""}
        </div>
      }
      disabled={!toolTipDefined}
      hoverOpenDelay={200}
      openOnTargetFocus={false}
      popoverClassName={props.className}
      position="top"
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
                  display: "flex",
                  position: "relative",
                  top: "-3px",
                }
              : {}
          }
        />
      </div>
    </Tooltip>
  );
}

export default PropertyHelpLabel;
