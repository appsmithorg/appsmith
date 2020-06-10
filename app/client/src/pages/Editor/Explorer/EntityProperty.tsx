import React from "react";
import styled from "styled-components";
import HighlightedCode from "components/editorComponents/HighlightedCode";

const StyledCode = styled(HighlightedCode)``;

export type EntityPropertyProps = {
  propertyName: string;
  entityName: string;
  value: string;
};

export const EntityProperty = (props: EntityPropertyProps) => {
  return (
    <StyledCode codeText={`{{${props.entityName}.${props.propertyName}}}`} />
  );
};

export default EntityProperty;
