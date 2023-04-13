import React, { forwardRef } from "react";
import { useId } from "@react-aria/utils";

import type {
  CheckboxRef as HeadlessCheckboxRef,
  CheckboxProps as HeadlessCheckboxProps,
} from "@design-system/headless";

import { Text } from "../Text";
import { InlineInput } from "../InlineInput";
import { StyledCheckbox } from "./index.styled";
import type { InlineInputProps as HeadlessInlineInputProps } from "@design-system/headless";

export type CheckboxProps = {
  labelPosition: "left" | "right";
} & HeadlessCheckboxProps &
  Pick<HeadlessInlineInputProps, "description" | "label" | "error">;

export const Checkbox = forwardRef<HeadlessCheckboxRef, CheckboxProps>(
  (props, ref) => {
    const {
      description,
      error,
      id: defaultId,
      label,
      labelPosition = "right",
      ...rest
    } = props;

    const id = useId(defaultId);

    return (
      <InlineInput
        description={description}
        error={error}
        id={id}
        label={<Text>{label}</Text>}
        labelPosition={labelPosition}
      >
        <StyledCheckbox id={id} ref={ref} {...rest} />
      </InlineInput>
    );
  },
);
