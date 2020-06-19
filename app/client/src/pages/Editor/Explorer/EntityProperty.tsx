import React from "react";
import styled from "styled-components";
import HighlightedCode, {
  SYNTAX_HIGHLIGHTING_SUPPORTED_LANGUAGES,
} from "components/editorComponents/HighlightedCode";
import { Tooltip } from "@blueprintjs/core";

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
        font-size: ${props => props.theme.fontSizes[4]}px;
        overflow-wrap: break-word;
        text-shadow: none;
      }
    }
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
  return (
    <StyledCode>
      <Tooltip content="Copy Binding" hoverOpenDelay={800} position="bottom">
        <HighlightedCode
          codeText={`{{${props.entityName}.${props.propertyName}}}`}
          language={SYNTAX_HIGHLIGHTING_SUPPORTED_LANGUAGES.APPSMITH}
          enableCopyToClipboard
        />
      </Tooltip>

      <HighlightedCode codeText={`${transformedValue(props.value)}`} />
    </StyledCode>
  );
};

export default EntityProperty;
