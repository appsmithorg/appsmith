import React from "react";
import styled from "styled-components";
import { Controller, ControllerProps, useFormContext } from "react-hook-form";

import FieldLabel from "./FieldLabel";

type FieldProps = {
  name: ControllerProps["name"];
  label: string;
  hideLabel?: boolean;
  render: ControllerProps["render"];
};

const WRAPPER_MARGIN_BOTTOM = 14;

const StyledWrapper = styled.div`
  margin-bottom: ${WRAPPER_MARGIN_BOTTOM}px;
`;

function Field({ hideLabel = false, label, name, render }: FieldProps) {
  const { control } = useFormContext();

  const controller = (
    <Controller control={control} name={name} render={render} />
  );

  return (
    <StyledWrapper>
      {hideLabel ? (
        controller
      ) : (
        <FieldLabel label={label}>{controller}</FieldLabel>
      )}
    </StyledWrapper>
  );
}

export default Field;
