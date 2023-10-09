import clsx from "clsx";
import React, { forwardRef } from "react";
import type {
  CheckboxRef as HeadlessCheckboxRef,
  CheckboxProps as HeadlessCheckboxProps,
} from "@design-system/headless";
import { Checkbox as HeadlessCheckbox } from "@design-system/headless";

import { Text } from "../../Text";
import checkboxStyles from "./styles.module.css";
import { inlineLabelStyles } from "../../../styles";

export type CheckboxProps = HeadlessCheckboxProps;

const _Checkbox = (props: CheckboxProps, ref: HeadlessCheckboxRef) => {
  const { children, labelPosition = "right", ...rest } = props;

  return (
    <HeadlessCheckbox
      labelPosition={labelPosition}
      ref={ref}
      {...rest}
      className={clsx(
        checkboxStyles.checkbox,
        inlineLabelStyles["inline-label"],
      )}
    >
      {Boolean(children) && <Text>{children}</Text>}
    </HeadlessCheckbox>
  );
};

export const Checkbox = forwardRef(_Checkbox);
