import React, { forwardRef } from "react";
import type { TextInputRef as HeadlessTextInputRef } from "@design-system/headless";

import { TextInput, type TextInputProps } from "../../TextInput";

export type CurrencyInputProps = TextInputProps;

const _CurrencyInput = (props: TextInputProps, ref: HeadlessTextInputRef) => {
  return <TextInput ref={ref} {...props} />;
};

export const CurrencyInput = forwardRef(_CurrencyInput);
