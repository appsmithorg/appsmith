import type { TextAreaProps } from "@appsmith/wds";

export interface ChatInputProps extends TextAreaProps {
  onSubmit?: () => void;
}
