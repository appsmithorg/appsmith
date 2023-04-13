import React, { forwardRef } from "react";
import { useFocusableRef } from "@react-spectrum/utils";
import classNames from "classnames";
import { FocusRing } from "@react-aria/focus";
import { mergeProps } from "@react-aria/utils";
import { useButton } from "@react-aria/button";
import { useHover } from "@react-aria/interactions";
import type { RefObject } from "react";
import type { FocusableRef } from "@react-types/shared";
import type { ButtonProps as SpectrumButtonProps } from "@react-types/button";

export interface ButtonProps extends SpectrumButtonProps {
  className?: string;
  isActive?: boolean;
  isHover?: boolean;
}

export type ButtonRef = FocusableRef<HTMLElement>;

export const Button = forwardRef((props: ButtonProps, ref: ButtonRef) => {
  const { autoFocus, children, className, isActive, isDisabled, isHover } =
    props;
  const domRef = useFocusableRef(ref) as RefObject<HTMLButtonElement>;
  const { buttonProps, isPressed } = useButton(props, domRef);
  const { hoverProps, isHovered } = useHover({ isDisabled });

  return (
    <FocusRing autoFocus={autoFocus} focusRingClass="focus-ring">
      <button
        {...mergeProps(buttonProps, hoverProps)}
        className={classNames(className, {
          "is-disabled": isDisabled,
          "is-active": isPressed || isActive,
          "is-hovered": isHovered || isHover,
        })}
        ref={domRef}
      >
        {children}
      </button>
    </FocusRing>
  );
});
