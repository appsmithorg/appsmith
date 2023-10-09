import clsx from "clsx";
import React, { forwardRef } from "react";

import type {
  RadioRef as HeadlessRadioRef,
  RadioProps as HeadlessRadioProps,
} from "@design-system/headless";
import { Radio as HeadlessRadio } from "@design-system/headless";

import { Text } from "@design-system/widgets";
import radioStyles from "./styles.module.css";
import { inlineLabelStyles } from "../../../styles";

export type RadioProps = HeadlessRadioProps;

const _Radio = (props: RadioProps, ref: HeadlessRadioRef) => {
  const { children, labelPosition = "right", ...rest } = props;

  return (
    <HeadlessRadio
      className={clsx(radioStyles.radio, inlineLabelStyles["inline-label"])}
      labelPosition={labelPosition}
      ref={ref}
      {...rest}
    >
      {Boolean(children) && <Text>{children}</Text>}
    </HeadlessRadio>
  );
};

export const Radio = forwardRef(_Radio);
