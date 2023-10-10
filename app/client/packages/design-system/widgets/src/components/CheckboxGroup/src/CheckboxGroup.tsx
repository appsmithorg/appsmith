import React, { forwardRef } from "react";

import type {
  CheckboxGroupRef as HeadlessCheckboxGroupRef,
  CheckboxGroupProps as HeadlessCheckboxGroupProps,
} from "@design-system/headless";
import { CheckboxGroup as HeadlessCheckboxGroup } from "@design-system/headless";

import { Text } from "../../Text";
import { fieldStyles } from "../../../styles";

export interface CheckboxGroupProps extends HeadlessCheckboxGroupProps {
  className?: string;
}

const _CheckboxGroup = (
  props: CheckboxGroupProps,
  ref: HeadlessCheckboxGroupRef,
) => {
  const { errorMessage, label, ...rest } = props;
  const wrappedErrorMessage = Boolean(errorMessage) && (
    <Text variant="footnote">{errorMessage}</Text>
  );
  const wrappedLabel = Boolean(label) && <Text>{label}</Text>;

  return (
    <HeadlessCheckboxGroup
      className={fieldStyles.field}
      errorMessage={wrappedErrorMessage}
      label={wrappedLabel}
      ref={ref}
      {...rest}
    />
  );
};

export const CheckboxGroup = forwardRef(_CheckboxGroup);
