import type { SIZES } from "@appsmith/wds";
import type {
  InputProps as HeadlessInputProps,
  TextAreaProps as HeadlessTextAreaProps,
} from "react-aria-components";

// Common properties for both Input and TextArea
interface CommonInputProps {
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
  isLoading?: boolean;
  isReadOnly?: boolean;
  size?: Exclude<keyof typeof SIZES, "xSmall">;
}

export interface InputProps
  extends Omit<HeadlessInputProps, "prefix" | "size">,
    CommonInputProps {}

export interface TextAreaInputProps
  extends Omit<HeadlessTextAreaProps, "prefix" | "size">,
    CommonInputProps {
  rows?: number;
  className?: string;
}
