import React, { forwardRef } from "react";

import type {
  RadioGroupRef as HeadlessRadioGroupRef,
  RadioGroupProps as HeadlessRadioGroupProps,
} from "@design-system/headless";
import { RadioGroup as HeadlessRadioGroup } from "@design-system/headless";

import { Text } from "../../Text";
import { fieldStyles } from "../../../styles";

export interface RadioGroupProps extends HeadlessRadioGroupProps {
  className?: string;
}

const _RadioGroup = (props: RadioGroupProps, ref: HeadlessRadioGroupRef) => {
  const { errorMessage, label, ...rest } = props;
  const wrappedErrorMessage = Boolean(errorMessage) && (
    <Text>{errorMessage}</Text>
  );
  const wrappedLabel = Boolean(label) && <Text>{label}</Text>;

  return (
    <HeadlessRadioGroup
      className={fieldStyles.field}
      errorMessage={wrappedErrorMessage}
      label={wrappedLabel}
      ref={ref}
      {...rest}
    />
  );
};

export const RadioGroup = forwardRef(_RadioGroup);
