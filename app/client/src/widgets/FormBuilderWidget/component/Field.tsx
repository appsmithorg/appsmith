import React, { Fragment } from "react";
import styled from "styled-components";
import { Controller, ControllerProps, useFormContext } from "react-hook-form";

import FieldLabel from "./FieldLabel";

type FieldProps = {
  hideLabel?: boolean;
  label: string;
  name: ControllerProps["name"];
  render: ControllerProps["render"];
  tooltip?: string;
};

const WRAPPER_MARGIN_BOTTOM = 14;

const StyledWrapper = styled.div`
  margin-bottom: ${WRAPPER_MARGIN_BOTTOM}px;
`;

const StyledControllerWrapper = styled.div`
  display: flex;
  align-items: center;
`;

function Field({
  hideLabel = false,
  label,
  name,
  render,
  tooltip,
}: FieldProps) {
  const { control } = useFormContext();

  const LabelWrapper = hideLabel ? Fragment : FieldLabel;

  const controller = (
    <StyledControllerWrapper>
      <Controller control={control} name={name} render={render} />
    </StyledControllerWrapper>
  );

  return (
    <StyledWrapper>
      {hideLabel ? (
        controller
      ) : (
        <LabelWrapper label={label} tooltip={tooltip}>
          {controller}
        </LabelWrapper>
      )}
    </StyledWrapper>
  );
}

export default Field;
