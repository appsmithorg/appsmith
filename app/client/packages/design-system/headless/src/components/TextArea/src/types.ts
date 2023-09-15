import type { TextInputBaseProps } from "../../TextInputBase";
import type { OmitedSpectrumTextFieldProps } from "../../TextInput";

export interface TextAreaProps
  extends OmitedSpectrumTextFieldProps,
    Pick<TextInputBaseProps, "inputClassName"> {
  spellCheck?: boolean;
  height?: number | string;
}
