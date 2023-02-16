/// <reference types="react" />
import { ButtonProps } from "./Button";
/**
 * creates locally scoped css variables to be used in variants styles
 *
 */
export declare const variantTokens: import("styled-components").FlattenInterpolation<import("styled-components").ThemedStyledProps<Pick<ButtonProps, "accentColor" | "variant">, any>>;
export declare const StyledButton: import("styled-components").StyledComponent<"button", any, {
    accentColor?: string | undefined;
    variant?: "input" | "filled" | "outline" | "light" | "subtle" | undefined;
    boxShadow?: string | undefined;
    borderRadius?: string | undefined;
    tooltip?: string | undefined;
    children?: import("react").ReactNode;
    isDisabled?: boolean | undefined;
    isLoading?: boolean | undefined;
    className?: string | undefined;
    leadingIcon?: import("react").ReactNode;
    trailingIcon?: import("react").ReactNode;
    as?: keyof JSX.IntrinsicElements | undefined;
} & import("react").HTMLAttributes<HTMLButtonElement>, never>;
