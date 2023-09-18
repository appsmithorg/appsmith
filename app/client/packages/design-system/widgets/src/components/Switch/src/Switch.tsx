import clsx from "clsx";
import React, { forwardRef } from "react";

import type {
  SwitchRef as HeadlessSwitchRef,
  SwitchProps as HeadlessSwitchProps,
} from "@design-system/headless";
import { Checkbox as HeadlessCheckbox } from "@design-system/headless";

import { Text } from "../../Text";
import switchStyles from "./styles.module.css";
import { inlineLabelStyles } from "../../../styles";

export type SwitchProps = Omit<HeadlessSwitchProps, "icon" | "isIndeterminate">;

const _Switch = (props: SwitchProps, ref: HeadlessSwitchRef) => {
  const { children, labelPosition = "right", ...rest } = props;

  return (
    <HeadlessCheckbox
      className={clsx(switchStyles.switch, inlineLabelStyles["inline-label"])}
      labelPosition={labelPosition}
      ref={ref}
      {...rest}
      icon={null}
    >
      {children && <Text>{children}</Text>}
    </HeadlessCheckbox>
  );
};

export const Switch = forwardRef(_Switch);
