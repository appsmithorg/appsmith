import React, { forwardRef } from "react";
import { Checkbox as HeadlessCheckbox } from "react-aria-components";
import { Text, Icon } from "@design-system/widgets";
import styles from "./styles.module.css";
import type { POSITION } from "@design-system/widgets";
import type { ForwardedRef } from "react";
import type { CheckboxProps as HeadlessCheckboxProps } from "react-aria-components";

export interface CheckboxProps extends HeadlessCheckboxProps {
  labelPosition?: keyof typeof POSITION;
}

const _Checkbox = (
  props: CheckboxProps,
  ref: ForwardedRef<HTMLLabelElement>,
) => {
  const {
    children,
    isIndeterminate,
    isRequired,
    labelPosition = "end",
    ...rest
  } = props;

  return (
    <HeadlessCheckbox
      ref={ref}
      {...rest}
      className={styles.checkbox}
      data-label-position={labelPosition}
      isIndeterminate={isIndeterminate}
    >
      {Boolean(isIndeterminate) ? <Icon name="minus" /> : <Icon name="check" />}
      <Text lineClamp={1}>{children}</Text>
      {Boolean(isRequired) && (
        <Text color="negative" data-inline-label-necessity-indicator-icon="">
          *
        </Text>
      )}
    </HeadlessCheckbox>
  );
};

export const Checkbox = forwardRef(_Checkbox);
