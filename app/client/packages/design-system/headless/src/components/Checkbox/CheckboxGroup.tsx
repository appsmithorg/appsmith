import React from "react";
import type { DOMRef } from "@react-types/shared";
import { useDOMRef } from "@react-spectrum/utils";
import { useCheckboxGroup } from "@react-aria/checkbox";
import { useCheckboxGroupState } from "@react-stately/checkbox";
import type { SpectrumCheckboxGroupProps } from "@react-types/checkbox";

import { Field } from "../Field";
import classNames from "classnames";
import { CheckboxGroupContext } from "./context";

function CheckboxGroup(
  props: SpectrumCheckboxGroupProps,
  ref: DOMRef<HTMLDivElement>,
) {
  const { children, orientation = "vertical" } = props;
  const domRef = useDOMRef(ref);
  const state = useCheckboxGroupState(props);
  const { descriptionProps, errorMessageProps, groupProps, labelProps } =
    useCheckboxGroup(props, state);

  return (
    <Field
      {...props}
      descriptionProps={descriptionProps}
      elementType="span"
      errorMessageProps={errorMessageProps}
      includeNecessityIndicatorInAccessibilityName
      labelProps={labelProps}
      ref={domRef}
    >
      <div
        {...groupProps}
        className={classNames({
          "fieldGroup-horizontal": orientation === "horizontal",
        })}
      >
        <CheckboxGroupContext.Provider value={state}>
          {children}
        </CheckboxGroupContext.Provider>
      </div>
    </Field>
  );
}

/**
 * A CheckboxGroup allows users to select one or more items from a list of choices.
 */
const _CheckboxGroup = React.forwardRef(CheckboxGroup);
export { _CheckboxGroup as CheckboxGroup };
