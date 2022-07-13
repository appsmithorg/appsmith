import { TooltipComponent as Tooltip } from "design-system";
import { EditorTheme } from "components/editorComponents/CodeEditor/EditorConfig";
import { Text, TextType } from "design-system";
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
      content={
        <Text
          style={{
            color: "#FAFAFA",
            maxWidth: "320px",
            textAlign: "center",
          }}
          type={TextType.P1}
        >
          {props.tooltip || ""}
        </Text>
      }
      disabled={!toolTipDefined}
      hoverOpenDelay={200}
      openOnTargetFocus={false}
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
