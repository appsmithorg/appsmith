import equal from "fast-deep-equal/es6";
import React, { useEffect, useRef } from "react";
import styled from "styled-components";
import { ControllerProps, useFormContext } from "react-hook-form";

import FieldLabel, { FieldLabelProps } from "./FieldLabel";
import { FIELD_MARGIN_BOTTOM } from "./styleConstants";

type FieldProps<TValue> = React.PropsWithChildren<
  {
    defaultValue: TValue;
    defaultValueValidatorFn?: (value: TValue) => boolean;
    fieldClassName: string;
    hideLabel?: boolean;
    inlineLabel?: boolean;
    isRequiredField?: boolean;
    name: ControllerProps["name"];
  } & FieldLabelProps
>;

type StyledWrapperProps = {
  direction: "row" | "column";
};

const StyledWrapper = styled.div<StyledWrapperProps>`
  margin-bottom: ${FIELD_MARGIN_BOTTOM}px;

  &:last-of-type {
    margin-bottom: 0;
  }
`;

function Field<TValue>({
  alignField,
  children,
  defaultValue,
  defaultValueValidatorFn,
  fieldClassName,
  hideLabel = false,
  inlineLabel = false,
  isRequiredField,
  label,
  labelStyle,
  labelTextColor,
  labelTextSize,
  name,
  tooltip,
}: FieldProps<TValue>) {
  const refDefaultValue = useRef<TValue>();
  const { setValue } = useFormContext();

  useEffect(() => {
    if (!equal(refDefaultValue.current, defaultValue)) {
      refDefaultValue.current = defaultValue;

      const isValid = defaultValueValidatorFn?.(defaultValue) ?? true;
      if (isValid) {
        setValue(name, defaultValue);
      }
    }
  }, [defaultValue, setValue]);

  const direction = inlineLabel ? "row" : "column";

  return (
    <StyledWrapper
      className={`t--jsonformfield-${fieldClassName}`}
      direction={direction}
    >
      {hideLabel ? (
        children
      ) : (
        <FieldLabel
          alignField={alignField}
          direction={direction}
          isRequiredField={isRequiredField}
          label={label}
          labelStyle={labelStyle}
          labelTextColor={labelTextColor}
          labelTextSize={labelTextSize}
          tooltip={tooltip}
        >
          {children}
        </FieldLabel>
      )}
    </StyledWrapper>
  );
}

export default Field;
