import React, { forwardRef } from "react";

import type {
  CheckboxGroupRef as HeadlessCheckboxGroupRef,
  CheckboxGroupProps as HeadlessCheckboxGroupProps,
} from "@design-system/headless";
import { CheckboxGroup as HeadlessCheckboxGroup } from "@design-system/headless";

import { fieldStyles } from "../../../styles";
import { ContextualHelp } from "../../TextInput/src/ContextualHelp";
import { getTypographyClassName } from "@design-system/theming";

export interface CheckboxGroupProps extends HeadlessCheckboxGroupProps {
  className?: string;
}

const _CheckboxGroup = (
  props: CheckboxGroupProps,
  ref: HeadlessCheckboxGroupRef,
) => {
  const { contextualHelp: contextualHelpProp, ...rest } = props;

  const contextualHelp = Boolean(contextualHelpProp) && (
    <ContextualHelp contextualHelp={contextualHelpProp} />
  );

  return (
    <HeadlessCheckboxGroup
      contextualHelp={contextualHelp}
      fieldClassName={fieldStyles.field}
      helpTextClassName={getTypographyClassName("footnote")}
      labelClassName={getTypographyClassName("body")}
      ref={ref}
      {...rest}
    />
  );
};

export const CheckboxGroup = forwardRef(_CheckboxGroup);
