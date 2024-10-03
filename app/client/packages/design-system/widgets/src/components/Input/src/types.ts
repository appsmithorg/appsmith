import type { SIZES } from "@appsmith/wds";
import type { InputProps as AriaInputProps } from "react-aria-components";

export type InputProps = Omit<AriaInputProps, "prefix" | "size"> & {
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
  isLoading?: boolean;
  isReadOnly?: boolean;
  size?: Omit<keyof typeof SIZES, "xSmall" | "large">;
  isMultiLine?: boolean;
};
