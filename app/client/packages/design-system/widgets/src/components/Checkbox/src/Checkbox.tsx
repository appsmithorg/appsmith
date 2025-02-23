import { clsx } from "clsx";
import React, { forwardRef } from "react";
import type { ForwardedRef } from "react";
import { Text, Icon } from "@appsmith/wds";
import { Checkbox as HeadlessCheckbox } from "react-aria-components";

import styles from "./styles.module.css";
import type { CheckboxProps } from "./types";

const _Checkbox = (
  props: CheckboxProps,
  ref: ForwardedRef<HTMLLabelElement>,
) => {
  const {
    children,
    className,
    isIndeterminate,
    isRequired,
    labelPosition = "end",
    ...rest
  } = props;

  return (
    <HeadlessCheckbox
      ref={ref}
      {...rest}
      className={clsx(styles.checkbox, className)}
      data-label-position={labelPosition}
      isIndeterminate={isIndeterminate}
    >
      {Boolean(isIndeterminate) ? <Icon name="minus" /> : <Icon name="check" />}
      {Boolean(children) && <Text lineClamp={1}>{children}</Text>}
      {Boolean(isRequired) && (
        <Text color="negative" data-inline-label-necessity-indicator-icon="">
          *
        </Text>
      )}
    </HeadlessCheckbox>
  );
};

export const Checkbox = forwardRef(_Checkbox);
