import React, { forwardRef } from "react";
import { useDOMRef } from "@react-spectrum/utils";
import type { DOMRef } from "@react-types/shared";
import type { StyleProps } from "@react-types/shared";
import { useCheckboxGroup } from "@react-aria/checkbox";
import { useCheckboxGroupState } from "@react-stately/checkbox";
import type { SpectrumCheckboxGroupProps } from "@react-types/checkbox";

import { Field } from "../Field";
import type { LabelProps } from "../Field";
import { CheckboxGroupContext } from "./context";

export type CheckboxGroupRef = DOMRef<HTMLDivElement>;
export interface CheckboxGroupProps
  extends Omit<SpectrumCheckboxGroupProps, keyof StyleProps> {
  className?: string;
  /** label width for the width, only used in side position */
  labelWidth?: LabelProps["labelWidth"];
}

export const CheckboxGroup = forwardRef(
  (props: CheckboxGroupProps, ref: CheckboxGroupRef) => {
    const { children, className, isDisabled, orientation = "vertical" } = props;
    const domRef = useDOMRef(ref);
    const state = useCheckboxGroupState(props);
    const { descriptionProps, errorMessageProps, groupProps, labelProps } =
      useCheckboxGroup(props, state);

    return (
      <Field
        {...props}
        descriptionProps={descriptionProps}
        errorMessageProps={errorMessageProps}
        includeNecessityIndicatorInAccessibilityName
        labelProps={labelProps}
        ref={domRef}
        wrapperClassName={className}
      >
        <div
          {...groupProps}
          data-disabled={props.isDisabled ? "" : undefined}
          data-field-group=""
          data-orientation={orientation}
        >
          <CheckboxGroupContext.Provider
            value={{
              state,
              isDisabled,
            }}
          >
            {children}
          </CheckboxGroupContext.Provider>
        </div>
      </Field>
    );
  },
);
