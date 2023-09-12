import type {
  OmitedSpectrumTextFieldProps,
  TextInputBaseProps,
} from "../../TextInput";

export interface TextAreaProps
  extends OmitedSpectrumTextFieldProps,
    Pick<TextInputBaseProps, "inputClassName"> {
  spellCheck?: boolean;
  height?: number | string;
}
