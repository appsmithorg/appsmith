import React from "react";
import styled from "styled-components";
import { Controller, ControllerProps, useFormContext } from "react-hook-form";

import FieldLabel, { FieldLabelProps } from "./FieldLabel";
import useDeepEffect from "utils/hooks/useDeepEffect";

type FieldProps = {
  hideLabel?: boolean;
  label: string;
  name: ControllerProps["name"];
  render: ControllerProps["render"];
  tooltip?: string;
  labelStyles: FieldLabelProps["labelStyles"];
  defaultValue: any;
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
  defaultValue,
  hideLabel = false,
  label,
  labelStyles = {},
  name,
  render,
  tooltip,
}: FieldProps) {
  const { control, setValue } = useFormContext();

  useDeepEffect(() => {
    setValue(name, defaultValue);
  }, [defaultValue, setValue]);

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
        <FieldLabel label={label} labelStyles={labelStyles} tooltip={tooltip}>
          {controller}
        </FieldLabel>
      )}
    </StyledWrapper>
  );
}

export default Field;
