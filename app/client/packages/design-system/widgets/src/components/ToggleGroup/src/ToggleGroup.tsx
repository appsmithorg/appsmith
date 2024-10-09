import type { ForwardedRef } from "react";
import React, { forwardRef, useRef } from "react";
import {
  useGroupOrientation,
  inputFieldStyles,
  FieldLabel,
  FieldError,
} from "@appsmith/wds";
import { CheckboxGroup as AriaToggleGroup, Group } from "react-aria-components";

import styles from "./styles.module.css";
import type { ToggleGroupProps } from "./types";

const _ToggleGroup = (
  props: ToggleGroupProps,
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
    <AriaToggleGroup
      {...rest}
      className={inputFieldStyles.field}
      data-field=""
      isDisabled={isDisabled}
      isReadOnly={isReadOnly}
      isRequired={isRequired}
      ref={ref}
    >
      <FieldLabel
        contextualHelp={contextualHelp}
        isDisabled={isDisabled}
        isRequired={isRequired}
      >
        {label}
      </FieldLabel>
      <Group
        className={styles.toggleGroup}
        data-orientation={orientation}
        ref={containerRef}
      >
        {children}
      </Group>
      <FieldError>{errorMessage}</FieldError>
    </AriaToggleGroup>
  );
};

export const ToggleGroup = forwardRef(_ToggleGroup);
