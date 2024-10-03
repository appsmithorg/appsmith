import type { TextInputProps } from "@appsmith/wds";

export interface TextAreaProps extends TextInputProps {
  placeholder?: string;
  height?: number | string;
}
