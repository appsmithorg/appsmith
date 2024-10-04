import type { SIZES } from "@appsmith/wds";
import type {
  InputProps as HeadlessInputProps,
  TextAreaProps as HeadlessTextAreaProps,
} from "react-aria-components";

export type InputProps = Omit<HeadlessInputProps, "prefix" | "size"> & {
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
  isLoading?: boolean;
  isReadOnly?: boolean;
  size?: Omit<keyof typeof SIZES, "xSmall" | "large">;
};

export type TextAreaInputProps = Omit<
  HeadlessTextAreaProps,
  "prefix" | "size"
> & {
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
  isLoading?: boolean;
  isReadOnly?: boolean;
  rows?: number;
};
