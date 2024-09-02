import type { EditorTheme } from "components/editorComponents/CodeEditor/EditorConfig";
import React from "react";
import styled from "styled-components";
import { Tooltip } from "@appsmith/ads";

const Label = styled.label`
  color: var(--ads-v2-color-fg);
  font-size: var(--ads-v2-font-size-4);
  font-weight: var(--ads-v2-font-weight-normal);
  -webkit-user-select: none;
  -ms-user-select: none;
  user-select: none;
`;

interface Props {
  className?: string;
  tooltip?: string;
  label: string;
  theme?: EditorTheme;
  maxWidth?: string;
  lineHeight?: string;
  onClick?: () => void;
}

function PropertyHelpLabel(props: Props) {
  const toolTipDefined = props.tooltip !== undefined;

  if (!props.label) return null;

  return (
    <Tooltip
      className={props.className}
      content={props.tooltip || ""}
      isDisabled={!toolTipDefined}
    >
      <div className="w-full" onClick={props.onClick}>
        <Label
          className={`t--property-control-label w-full block text-ellipsis overflow-hidden`}
          style={{
            cursor: toolTipDefined ? "help" : "default",
          }}
        >
          {props.label}
        </Label>
        <span
          className={"underline"}
          // style={
          //   toolTipDefined
          //     ? {
          //         borderBottom: "1px dashed",
          //         width: "100%",
          //         display: "flex",
          //         position: "relative",
          //         top: "-3px",
          //       }
          //     : {}
          // }
        />
      </div>
    </Tooltip>
  );
}

export default PropertyHelpLabel;
