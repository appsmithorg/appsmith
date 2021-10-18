import React from "react";
import styled from "styled-components";
import { Controller, ControllerProps, useFormContext } from "react-hook-form";

type FieldProps = {
  name: ControllerProps["name"];
  label: string;
  render: ControllerProps["render"];
};

const WRAPPER_MARGIN_Y = 14;
const LABEL_TEXT_MARGIN_BOTTOM = 4;

const StyledWrapper = styled.div`
  margin: ${WRAPPER_MARGIN_Y}px 0;
`;

const StyledLabelText = styled.p`
  margin-bottom: ${LABEL_TEXT_MARGIN_BOTTOM}px;
`;

function Field({ label, name, render }: FieldProps) {
  const { control } = useFormContext();

  return (
    <StyledWrapper>
      <label>
        <StyledLabelText>{label}</StyledLabelText>
        <Controller control={control} name={name} render={render} />
      </label>
    </StyledWrapper>
  );
}

export default Field;
