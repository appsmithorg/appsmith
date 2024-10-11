import { Text } from "@appsmith/wds";
import React, { forwardRef } from "react";
import type { ForwardedRef } from "react";
import { Radio as AriaRadio } from "react-aria-components";

import styles from "./styles.module.css";
import type { RadioProps } from "./types";

const _Radio = (props: RadioProps, ref: ForwardedRef<HTMLLabelElement>) => {
  const { children, labelPosition = "end", ...rest } = props;

  return (
    <AriaRadio
      ref={ref}
      {...rest}
      className={styles.radio}
      data-label-position={labelPosition}
    >
      {Boolean(children) && <Text lineClamp={1}>{children}</Text>}
    </AriaRadio>
  );
};

export const Radio = forwardRef(_Radio);
