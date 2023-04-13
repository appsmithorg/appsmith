import React, { forwardRef } from "react";
import { useId } from "@react-aria/utils";
import { FocusRing } from "@react-aria/focus";
import { useCheckbox } from "@react-aria/checkbox";
import CheckIcon from "remixicon-react/CheckLineIcon";
import { useToggleState } from "@react-stately/toggle";
import SubtractIcon from "remixicon-react/SubtractLineIcon";
import type { AriaCheckboxProps } from "@react-types/checkbox";

import { useProvidedRefOrCreate } from "../../utils/use-provided-ref-or-create";

export interface CheckboxProps extends AriaCheckboxProps {
  id?: string;
  icon?: React.ReactNode;
  className?: string;
}

export type CheckboxRef = HTMLInputElement;

export const Checkbox = forwardRef<CheckboxRef, CheckboxProps>(
  (props, providedRef) => {
    const {
      className,
      icon = <CheckIcon />,
      id: defaultId,
      isIndeterminate: indeterminate,
      ...rest
    } = props;
    const state = useToggleState(rest);
    const ref = useProvidedRefOrCreate(
      providedRef as React.RefObject<HTMLInputElement>,
    );
    const { inputProps } = useCheckbox(rest, state, ref);
    const id = useId(defaultId);

    return (
      <div className={className}>
        <FocusRing focusRingClass="focus-ring">
          <input {...inputProps} id={id} />
        </FocusRing>
        <span className="icon" role="presentation">
          {indeterminate ? <SubtractIcon /> : icon}
        </span>
      </div>
    );
  },
);
