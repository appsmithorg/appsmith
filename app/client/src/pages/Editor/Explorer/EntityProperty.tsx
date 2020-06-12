import React from "react";
import styled from "styled-components";
import HighlightedCode, {
  SYNTAX_HIGHLIGHTING_SUPPORTED_LANGUAGES,
} from "components/editorComponents/HighlightedCode";

const StyledCode = styled.div`
  &&&& {
    & > div:last-child {
      margin: 5px 0;
      code.${SYNTAX_HIGHLIGHTING_SUPPORTED_LANGUAGES.JAVASCRIPT} {
        font-size: ${props => props.theme.fontSizes[2]}px;
        white-space: nowrap;
        overflow: hidden;
        border: none;
        box-shadow: none;
      }
    }
    & > div:first-child {
      code.${SYNTAX_HIGHLIGHTING_SUPPORTED_LANGUAGES.APPSMITH} {
        white-space: pre-wrap;
        border: none;
        background: transparent;
        box-shadow: none;
        font-size: ${props => props.theme.fontSizes[3]}px;
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
    if (typeof value === "object") {
      return JSON.stringify(value).slice(0, 20) + "...";
    }
    return value;
  };
  return (
    <StyledCode>
      <HighlightedCode
        codeText={`{{${props.entityName}.${props.propertyName}}}`}
        language={SYNTAX_HIGHLIGHTING_SUPPORTED_LANGUAGES.APPSMITH}
      />
      <HighlightedCode codeText={`${transformedValue(props.value)}`} />
    </StyledCode>
  );
};

export default EntityProperty;
