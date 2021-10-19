import React, { PropsWithChildren } from "react";
import styled from "styled-components";

const LABEL_TEXT_MARGIN_BOTTOM = 4;

const StyledLabelText = styled.p`
  margin-bottom: ${LABEL_TEXT_MARGIN_BOTTOM}px;
`;

type FieldLabelProps = PropsWithChildren<{
  label: string;
}>;

function FieldLabel({ children, label }: FieldLabelProps) {
  return (
    <label>
      <StyledLabelText>{label}</StyledLabelText>
      {children}
    </label>
  );
}

export default FieldLabel;
