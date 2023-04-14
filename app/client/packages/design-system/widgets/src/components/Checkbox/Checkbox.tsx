import React, { forwardRef } from "react";
import { useId } from "@react-aria/utils";

import type {
  CheckboxRef as HeadlessCheckboxRef,
  CheckboxProps as HeadlessCheckboxProps,
} from "@design-system/headless";

import { InlineInput } from "../InlineInput";
import { StyledCheckbox } from "./index.styled";
import type { InlineInputProps } from "../InlineInput";

export type CheckboxProps = HeadlessCheckboxProps &
  Omit<InlineInputProps, "label"> & {
    children?: React.ReactNode;
  };

export const Checkbox = forwardRef<HeadlessCheckboxRef, CheckboxProps>(
  (props, ref) => {
    const {
      children,
      description,
      error,
      id: defaultId,
      isDisabled,
      labelAlignment = "left",
      labelPosition = "right",
      ...rest
    } = props;

    const id = useId(defaultId);

    return (
      <InlineInput
        description={description}
        error={error}
        id={id}
        isDisabled={isDisabled}
        label={children}
        labelAlignment={labelAlignment}
        labelPosition={labelPosition}
      >
        <StyledCheckbox id={id} isDisabled={isDisabled} ref={ref} {...rest} />
      </InlineInput>
    );
  },
);
