import type { ForwardedRef } from "react";
import React, { forwardRef, useRef } from "react";
import {
  useGroupOrientation,
  inputFieldStyles,
  FieldLabel,
  FieldDescription,
  FieldError,
  toggleGroupStyles,
} from "@appsmith/wds";
import { RadioGroup as AriaRadioGroup, Group } from "react-aria-components";

import type { RadioGroupProps } from "./types";

const _RadioGroup = (
  props: RadioGroupProps,
  ref: ForwardedRef<HTMLDivElement>,
) => {
  const {
    children,
    contextualHelp,
    description,
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
    <AriaRadioGroup
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
      {Boolean(description) && (
        <FieldDescription>{description}</FieldDescription>
      )}
      {Boolean(errorMessage) && <FieldError>{errorMessage}</FieldError>}
    </AriaRadioGroup>
  );
};

export const RadioGroup = forwardRef(_RadioGroup);
