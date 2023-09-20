import type { StyleProps } from "@react-types/shared";
import type { SpectrumTextFieldProps } from "@react-types/textfield";

import type { TextInputBaseProps } from "../../TextInputBase";

export type OmitedSpectrumTextFieldProps = Omit<
  SpectrumTextFieldProps,
  keyof StyleProps | "icon" | "isQuiet" | "necessityIndicator"
>;

export interface TextInputProps
  extends OmitedSpectrumTextFieldProps,
    Pick<TextInputBaseProps, "startIcon" | "endIcon" | "inputClassName"> {
  spellCheck?: boolean;
}
