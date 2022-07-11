import React, { useMemo, forwardRef, HTMLAttributes } from "react";
import { IconName } from "@blueprintjs/icons";
import { withTooltip } from "components/wds";
import { ForwardRefComponent as PolymorphicForwardRefComponent } from "@radix-ui/react-polymorphic";

import _ from "lodash";
import {
  ButtonPlacement,
  ButtonVariant,
  ButtonVariantTypes,
} from "components/constants";
import {
  getComplementaryGrayscaleColor,
  lightenColor,
} from "widgets/WidgetUtils";
import { borderRadiusOptions } from "constants/ThemeConstants";
import withRecaptcha, { RecaptchaProps } from "./withRecaptcha";
import { getCSSVariables } from "./styles";
import styles from "./styles.module.css";
import cx from "clsx";

type ButtonStyleProps = {
  buttonColor?: string;
  buttonVariant?: ButtonVariant;
  iconName?: IconName;
  placement?: ButtonPlacement;
  justifyContent?:
    | "flex-start"
    | "flex-end"
    | "center"
    | "space-between"
    | "space-around"
    | "space-evenly";
};

export type Props = {
  variant?: keyof typeof VariantTypes;
  boxShadow?: string;
  borderRadius?: string;
  tooltip?: string;
  children?: React.ReactNode;
  leftIcon?: IconName;
  isDisabled?: boolean;
  isLoading?: boolean;
  className?: string;
} & ButtonStyleProps &
  RecaptchaProps &
  HTMLAttributes<HTMLButtonElement>;

export enum VariantTypes {
  solid = "solid",
  outline = "outline",
  ghost = "ghost",
  link = "link",
}

// Source: https://github.com/emotion-js/emotion/blob/master/packages/styled-base/types/helper.d.ts
// A more precise version of just React.ComponentPropsWithoutRef on its own
export type PropsOf<
  C extends keyof JSX.IntrinsicElements | React.JSXElementConstructor<any>
> = JSX.LibraryManagedAttributes<C, React.ComponentPropsWithoutRef<C>>;

type AsProp<C extends React.ElementType> = {
  /**
   * An override of the default HTML tag.
   * Can also be another React component.
   */
  as?: C;
};

/**
 * Allows for extending a set of props (`ExtendedProps`) by an overriding set of props
 * (`OverrideProps`), ensuring that any duplicates are overridden by the overriding
 * set of props.
 */
export type ExtendableProps<
  ExtendedProps = {},
  OverrideProps = {}
> = OverrideProps & Omit<ExtendedProps, keyof OverrideProps>;

/**
 * Allows for inheriting the props from the specified element type so that
 * props like children, className & style work, as well as element-specific
 * attributes like aria roles. The component (`C`) must be passed in.
 */
export type InheritableElementProps<
  C extends React.ElementType,
  Props = {}
> = ExtendableProps<PropsOf<C>, Props>;

/**
 * A more sophisticated version of `InheritableElementProps` where
 * the passed in `as` prop will determine which props can be included
 */
export type PolymorphicComponentProps<
  C extends React.ElementType,
  Props = {}
> = InheritableElementProps<C, Props & AsProp<C>>;

/**
 * Utility type to extract the `ref` prop from a polymorphic component
 */
export type PolymorphicRef<
  C extends React.ElementType
> = React.ComponentPropsWithRef<C>["ref"];
/**
 * A wrapper of `PolymorphicComponentProps` that also includes the `ref`
 * prop for the polymorphic component
 */
export type PolymorphicComponentPropsWithRef<
  C extends React.ElementType,
  Props = {}
> = PolymorphicComponentProps<C, Props> & { ref?: PolymorphicRef<C> };

type ButtonProps<
  C extends React.ElementType
> = PolymorphicComponentPropsWithRef<C, Props>;

type ButtonComponent = <C extends React.ElementType = "button">(
  props: ButtonProps<C>,
) => React.ReactElement | null;

const Button: ButtonComponent = forwardRef(
  <C extends React.ElementType = "button">(
    props: ButtonProps<C>,
    forwardedRef: PolymorphicRef<C>,
  ) => {
    const {
      as,
      borderRadius,
      boxShadow,
      buttonColor,
      buttonVariant,
      children,
      className,
      isDisabled,
      variant,
      ...rest
    } = props;

    const Component = as || "button";

    const computedClassnames = cx({
      [styles.base]: true,
      [styles[variant || "solid"]]: true,
      [className || ""]: true,
    });

    const cssVariables = useMemo(() => {
      return getCSSVariables(props, "default");
    }, [borderRadius, buttonColor, boxShadow]);

    return (
      <Component
        {...rest}
        className={computedClassnames}
        disabled={isDisabled}
        ref={forwardedRef}
        style={cssVariables}
      >
        {children}
      </Component>
    );
  },
);

export default withRecaptcha(withTooltip(Button));
