import React from "react";
import styled from "styled-components";
import { Controller, ControllerProps, useFormContext } from "react-hook-form";

type FieldProps = {
  name: string;
  render: ControllerProps["render"];
};

const WRAPPER_MARGIN_Y = 10;

const StyledWrapper = styled.div`
  margin: ${WRAPPER_MARGIN_Y}px 0;
`;

function Field({ name, render }: FieldProps) {
  const { control } = useFormContext();

  return (
    <StyledWrapper>
      {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
      {/* @ts-ignore */}
      <Controller control={control} name={name} render={render} />
    </StyledWrapper>
  );
}

export default Field;
