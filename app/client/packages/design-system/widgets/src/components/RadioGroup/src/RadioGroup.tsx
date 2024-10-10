import type { ForwardedRef } from "react";
import React, { forwardRef, useRef } from "react";
import {
  useGroupOrientation,
  inputFieldStyles,
  FieldLabel,
  FieldError,
  toggleGroupStyles,
} from "@appsmith/wds";
import { RadioGroup as HeadlessRadioGroup, Group } from "react-aria-components";

import type { RadioGroupProps } from "./types";

const _RadioGroup = (
  props: RadioGroupProps,
  ref: ForwardedRef<HTMLDivElement>,
) => {
  const {
    children,
    contextualHelp,
    errorMessage,
    isDisabled,
    isReadOnly,
    isRequired,
    label,
    ...rest
  } = props;
  const containerRef = useRef<HTMLDivElement>(null);
  const { orientation } = useGroupOrientation(
    { orientation: props.orientation },
    containerRef,
  );

  return (
    <HeadlessRadioGroup
      {...rest}
      className={inputFieldStyles.field}
      isDisabled={isDisabled}
      isReadOnly={isReadOnly}
      isRequired={isRequired}
      ref={ref}
    >
      {Boolean(label) && (
        <FieldLabel
          contextualHelp={contextualHelp}
          isDisabled={isDisabled}
          isRequired={isRequired}
        >
          {label}
        </FieldLabel>
      )}
      <Group
        className={toggleGroupStyles.toggleGroup}
        data-orientation={orientation}
        ref={containerRef}
      >
        {children}
      </Group>
      <FieldError>{errorMessage}</FieldError>
    </HeadlessRadioGroup>
  );
};

export const RadioGroup = forwardRef(_RadioGroup);
