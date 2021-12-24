import equal from "fast-deep-equal/es6";
import React, { useEffect, useRef } from "react";
import styled from "styled-components";
import { Controller, ControllerProps, useFormContext } from "react-hook-form";

import FieldLabel, { FieldLabelProps } from "./FieldLabel";
import { FIELD_MARGIN_BOTTOM } from "./styleConstants";

type FieldProps<TValue> = {
  defaultValue: TValue;
  defaultValueValidatorFn?: (value: TValue) => boolean;
  hideLabel?: boolean;
  label: string;
  labelStyles: FieldLabelProps["labelStyles"];
  name: ControllerProps["name"];
  render: ControllerProps["render"];
  tooltip?: string;
};

const StyledWrapper = styled.div`
  margin-bottom: ${FIELD_MARGIN_BOTTOM}px;

  &:last-of-type {
    margin-bottom: 0;
  }
`;

const StyledControllerWrapper = styled.div`
  display: flex;
  align-items: center;
`;

function Field<TValue>({
  defaultValue,
  defaultValueValidatorFn,
  hideLabel = false,
  label,
  labelStyles = {},
  name,
  render,
  tooltip,
}: FieldProps<TValue>) {
  const refDefaultValue = useRef<TValue>();
  const { control, setValue } = useFormContext();

  useEffect(() => {
    if (!equal(refDefaultValue.current, defaultValue)) {
      refDefaultValue.current = defaultValue;

      const isValid = defaultValueValidatorFn?.(defaultValue) ?? true;
      if (isValid) {
        setValue(name, defaultValue);
      }
    }
  }, [defaultValue, setValue]);

  const controller = (
    <StyledControllerWrapper>
      <Controller
        control={control}
        name={name}
        render={render}
        shouldUnregister
      />
    </StyledControllerWrapper>
  );

  return (
    <StyledWrapper>
      {hideLabel ? (
        controller
      ) : (
        <>
          <FieldLabel
            label={label}
            labelStyles={labelStyles}
            tooltip={tooltip}
          />
          {controller}
        </>
      )}
    </StyledWrapper>
  );
}

export default Field;
