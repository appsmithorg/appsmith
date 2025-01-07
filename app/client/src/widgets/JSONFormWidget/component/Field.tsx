import equal from "fast-deep-equal/es6";
import React, { useEffect, useRef } from "react";
import styled from "styled-components";
import type { ControllerProps } from "react-hook-form";
import { useFormContext } from "react-hook-form";

import type { FieldLabelProps } from "./FieldLabel";
import FieldLabel from "./FieldLabel";
import useUpdateAccessor from "../fields/useObserveAccessor";
import { FIELD_MARGIN_BOTTOM } from "./styleConstants";
import { klonaRegularWithTelemetry } from "utils/helpers";

type FieldProps<TValue> = React.PropsWithChildren<
  {
    accessor: string;
    defaultValue: TValue;
    fieldClassName: string;
    hideLabel?: boolean;
    inlineLabel?: boolean;
    isRequiredField?: boolean;
    name: ControllerProps["name"];
  } & FieldLabelProps
>;

interface StyledWrapperProps {
  direction: "row" | "column";
}

const StyledWrapper = styled.div<StyledWrapperProps>`
  margin-bottom: ${FIELD_MARGIN_BOTTOM}px;

  &:last-of-type {
    margin-bottom: 0;
  }
`;

function Field<TValue>({
  accessor,
  alignField,
  children,
  defaultValue,
  fieldClassName,
  hideLabel = false,
  inlineLabel = false,
  isRequiredField,
  label,
  labelPosition,
  labelStyle,
  labelTextColor,
  labelTextSize,
  name,
  tooltip,
}: FieldProps<TValue>) {
  const refDefaultValue = useRef<TValue>();
  const { setValue } = useFormContext();

  useUpdateAccessor({ accessor });

  useEffect(() => {
    if (!equal(refDefaultValue.current, defaultValue)) {
      refDefaultValue.current = defaultValue;

      // Follow the comment in Form component above reset(convertedFormData);
      setTimeout(() => {
        setValue(name, klonaRegularWithTelemetry(defaultValue, "Field"));
      }, 0);
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
          labelPosition={labelPosition}
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
