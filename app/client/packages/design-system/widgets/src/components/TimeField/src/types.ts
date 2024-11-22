import type { ReactNode } from "react";
import type { FieldProps, SIZES } from "@appsmith/wds";
import type {
  TimeFieldProps as AriaTimeFieldProps,
  TimeValue,
} from "react-aria-components";

export interface TimeFieldProps<T extends TimeValue>
  extends AriaTimeFieldProps<T>,
    FieldProps {
  suffix?: ReactNode;
  prefix?: ReactNode;
  size?: Omit<keyof typeof SIZES, "xSmall">;
}
