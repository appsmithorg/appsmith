import React, { forwardRef } from "react";

import type {
  RadioGroupRef as HeadlessRadioGroupRef,
  RadioGroupProps as HeadlessRadioGroupProps,
} from "@design-system/headless";
import { getTypographyClassName } from "@design-system/theming";
import { RadioGroup as HeadlessRadioGroup } from "@design-system/headless";

import { fieldStyles } from "../../../styles";
import { ContextualHelp } from "../../TextInput/src/ContextualHelp";

export interface RadioGroupProps extends HeadlessRadioGroupProps {
  className?: string;
}

const _RadioGroup = (props: RadioGroupProps, ref: HeadlessRadioGroupRef) => {
  const { contextualHelp: contextualHelpProp, ...rest } = props;

  const contextualHelp = Boolean(contextualHelpProp) && (
    <ContextualHelp contextualHelp={contextualHelpProp} />
  );

  return (
    <HeadlessRadioGroup
      contextualHelp={contextualHelp}
      fieldClassName={fieldStyles.field}
      helpTextClassName={getTypographyClassName("footnote")}
      labelClassName={getTypographyClassName("body")}
      ref={ref}
      {...rest}
    />
  );
};

export const RadioGroup = forwardRef(_RadioGroup);
