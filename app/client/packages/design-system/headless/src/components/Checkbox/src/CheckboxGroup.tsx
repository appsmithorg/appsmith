import React, { forwardRef } from "react";
import { useDOMRef } from "@react-spectrum/utils";
import type { DOMRef } from "@react-types/shared";
import type { StyleProps } from "@react-types/shared";
import { useCheckboxGroup } from "@react-aria/checkbox";
import { useCheckboxGroupState } from "@react-stately/checkbox";
import type { SpectrumCheckboxGroupProps } from "@react-types/checkbox";

import { Field } from "@design-system/headless";
import { CheckboxGroupContext } from "./context";

export type CheckboxGroupRef = DOMRef<HTMLDivElement>;

export interface CheckboxGroupProps
  extends Omit<
    SpectrumCheckboxGroupProps,
    keyof StyleProps | "labelPosition" | "labelAlign" | "isEmphasized"
  > {
  className?: string;
}

const _CheckboxGroup = (props: CheckboxGroupProps, ref: CheckboxGroupRef) => {
  const {
    children,
    className,
    isDisabled = false,
    orientation = "vertical",
  } = props;
  const domRef = useDOMRef(ref);
  const state = useCheckboxGroupState(props);
  const { descriptionProps, errorMessageProps, groupProps, labelProps } =
    useCheckboxGroup(props, state);

  return (
    <Field
      {...props}
      descriptionProps={descriptionProps}
      errorMessageProps={errorMessageProps}
      fieldType="field-group"
      labelProps={labelProps}
      ref={domRef}
      wrapperClassName={className}
    >
      <div
        {...groupProps}
        data-disabled={isDisabled ? "" : undefined}
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
};

export const CheckboxGroup = forwardRef(_CheckboxGroup);
