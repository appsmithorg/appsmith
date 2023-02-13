import { useId } from "@mantine/hooks";
import React, { forwardRef, CSSProperties, useMemo } from "react";

import { InlineInput } from "../InlineInput";
import { CheckboxGroup } from "./CheckboxGroup";
import CheckIcon from "remixicon-react/CheckLineIcon";
import SubtractIcon from "remixicon-react/SubtractLineIcon";
import { useCheckboxGroupContext } from "./CheckboxGroup.context";

import { Container, Input, Icon } from "./index.styled";
// import { darkenColor } from "widgets/WidgetUtils";

export interface CheckboxProps
  extends Omit<React.ComponentPropsWithRef<"input">, "type"> {
  label?: React.ReactNode;
  indeterminate?: boolean;
  wrapperProps?: Record<string, any>;
  id?: string;
  icon?: React.ReactNode;
  labelPosition?: "left" | "right";
  description?: React.ReactNode;

  /** Displays error message after input */
  error?: React.ReactNode;

  /** sets the input disabled */
  isDisabled?: boolean;

  /** sets the checkbox raidus */
  borderRadius?: string;

  /** sets the checkbox accent color */
  accentColor?: string;
}
export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  (props, ref) => {
    const {
      checked,
      className,
      description,
      isDisabled: disabled,
      error,
      icon = <CheckIcon />,
      id,
      indeterminate,
      label,
      labelPosition = "right",
      value,
      wrapperProps,
      borderRadius,
      accentColor,
      ...others
    } = props;

    const ctx = useCheckboxGroupContext();
    const uuid = useId(id);

    const contextProps = ctx
      ? {
          checked: ctx.value.includes(value as string),
          onChange: ctx.onChange,
        }
      : {};

    const cssVariables = useMemo(
      () =>
        ({
          "--wds-color-accent": accentColor,
          // "--wds-color-accent-hover": darkenColor(accentColor),
          "--wds-v2-radii": borderRadius,
        } as CSSProperties),
      [borderRadius, accentColor],
    );

    return (
      <InlineInput
        className={className}
        data-checked={contextProps.checked || undefined}
        description={description}
        disabled={disabled}
        error={error}
        id={uuid}
        label={label}
        labelPosition={labelPosition}
        {...wrapperProps}
      >
        <Container labelPosition={labelPosition}>
          <Input
            checked={checked}
            disabled={disabled}
            id={uuid}
            ref={ref}
            type="checkbox"
            value={value}
            {...others}
            {...contextProps}
          />

          {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
          {/*// @ts-ignore*/}
          <Icon role="presentation" style={cssVariables}>
            {indeterminate ? <SubtractIcon /> : icon}
          </Icon>
        </Container>
      </InlineInput>
    );
  },
) as any;

// Checkbox.displayName = "@appsmith/wds/checkbox";
Checkbox.Group = CheckboxGroup;
