import React from "react";
import styled from "styled-components";
import HighlightedCode, {
  SYNTAX_HIGHLIGHTING_SUPPORTED_LANGUAGES,
} from "components/editorComponents/HighlightedCode";
import { Popover, PopoverInteractionKind, Tooltip } from "@blueprintjs/core";
import { CurrentValueViewer } from "components/editorComponents/EvaluatedValuePopup";
const StyledCode = styled.div`
  &&&& {
    margin: 10px 0;
    code {
      border: none;
      box-shadow: none;
      padding: 5px 0.2em;
    }
    & > div {
      margin: 5px 0;
    }
    & {
      code.${SYNTAX_HIGHLIGHTING_SUPPORTED_LANGUAGES.JAVASCRIPT} {
        font-size: ${props => props.theme.fontSizes[2]}px;
        white-space: nowrap;
        overflow: hidden;
      }
    }
    & {
      code.${SYNTAX_HIGHLIGHTING_SUPPORTED_LANGUAGES.APPSMITH} {
        white-space: pre-wrap;
        background: transparent;
        font-size: ${props => props.theme.fontSizes[3]}px;
        overflow-wrap: break-word;
        text-shadow: none;
      }
    }
  }
`;

const StyledPopoverContent = styled.div`
  background: black;
  max-height: 400px;
  width: 400px;
  padding: 10px;
  overflow: auto;
  & > div {
    max-height: 100%;
    & > pre {
      overflow: hidden;
    }
  }
  & > pre {
    width: 100%;
    overflow: hidden;
    white-space: pre-wrap;
    color: white;
  }
`;

export type EntityPropertyProps = {
  propertyName: string;
  entityName: string;
  value: string;
};

export const EntityProperty = (props: EntityPropertyProps) => {
  const transformedValue = (value: any) => {
    if (
      typeof value === "object" ||
      Array.isArray(value) ||
      (value && value.length && value.length > 30)
    ) {
      return JSON.stringify(value).slice(0, 25) + "...";
    }
    return value;
  };
  const showPopup =
    typeof props.value === "object" ||
    Array.isArray(props.value) ||
    (props.value && props.value.length && props.value.length > 25);
  const isString = typeof props.value === "string";

  return (
    <StyledCode>
      <Tooltip content="Copy Binding" hoverOpenDelay={800} position="bottom">
        <HighlightedCode
          codeText={`{{${props.entityName}.${props.propertyName}}}`}
          language={SYNTAX_HIGHLIGHTING_SUPPORTED_LANGUAGES.APPSMITH}
          enableCopyToClipboard
        />
      </Tooltip>
      <Popover
        interactionKind={PopoverInteractionKind.HOVER}
        position="left"
        modifiers={{
          offset: {
            enabled: true,
            offset: 200,
          },

          preventOverflow: {
            enabled: false,
            boundariesElement: "viewport",
          },
        }}
      >
        <HighlightedCode codeText={`${transformedValue(props.value)}`} />
        {showPopup && (
          <StyledPopoverContent>
            {!isString && (
              <CurrentValueViewer
                theme="DARK"
                evaluatedValue={props.value}
                hideLabel
              />
            )}
            {isString && <pre>{props.value}</pre>}
          </StyledPopoverContent>
        )}
      </Popover>
    </StyledCode>
  );
};

export default EntityProperty;
