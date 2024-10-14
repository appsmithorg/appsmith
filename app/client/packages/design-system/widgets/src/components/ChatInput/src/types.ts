import type { TextAreaProps } from "@appsmith/wds";

export interface ChatInputProps extends TextAreaProps {
  /** callback function when the user submits the chat input */
  onSubmit?: () => void;
  /** flag for disable the submit button */
  isSubmitDisabled?: boolean;
}
