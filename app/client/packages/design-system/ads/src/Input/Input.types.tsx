import type { TextFieldProps } from "@react-types/textfield";
import type { IconProps } from "../Icon";
import type { Sizes } from "../__config__/types";

export type InputSizes = Extract<Sizes, "sm" | "md">;

export type InputTypes =
  | "text"
  | "password"
  | "email"
  | "number"
  | "tel"
  | "url"
  | "search"
  | "currency";

// Input props
interface Props extends TextFieldProps {
  /** TODO: renderAs needs to changed to as */
  /** Attribute to change the rendering component */
  renderAs?: "input" | "textarea";
  /** (try not to) pass addition classes here */
  className?: string;
  /** whether only input is disabled. */
  disableTextInput?: boolean;
  /** label position  */
  labelPosition?: "top" | "left";
  /** name */
  name?: string;
  /** start icon  */
  startIcon?: string;
  /** start icon props */
  startIconProps?: Omit<IconProps, "name">;
  /** end icon  */
  endIcon?: string;
  /** end icon props */
  endIconProps?: Omit<IconProps, "name">;
  /** size */
  size?: InputSizes;
  /** type */
  type?: InputTypes;
  /** width */
  UNSAFE_width?: string;
  /** height */
  UNSAFE_height?: string;
  /** value */
  value?: string;
  /** onValue change trigger */
  onChange?: (value: string) => void;
  /** Whether the input given passes the validation parameters. */
  isValid?: boolean;
}

export interface InputProps
  extends Props,
    Omit<React.HTMLAttributes<HTMLInputElement>, keyof Props> {}
