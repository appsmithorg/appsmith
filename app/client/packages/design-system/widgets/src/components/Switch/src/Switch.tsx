import { Text } from "@appsmith/wds";
import React, { forwardRef } from "react";
import type { ForwardedRef } from "react";
import { Checkbox as HeadlessCheckbox } from "react-aria-components";

import styles from "./styles.module.css";
import type { SwitchProps } from "./types";

const _Switch = (props: SwitchProps, ref: ForwardedRef<HTMLLabelElement>) => {
  const { children, labelPosition = "end", ...rest } = props;

  return (
    <HeadlessCheckbox
      ref={ref}
      {...rest}
      className={styles.switch}
      data-label-position={labelPosition}
    >
      <span aria-hidden="true" data-icon="" role="presentation" />
      <Text lineClamp={1}>{children}</Text>
    </HeadlessCheckbox>
  );
};

export const Switch = forwardRef(_Switch);
