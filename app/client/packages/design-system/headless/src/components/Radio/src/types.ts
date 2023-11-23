import type { StyleProps } from "@react-types/shared";
import type { SpectrumRadioGroupProps } from "@react-types/radio";
import type { TextInputProps } from "../../TextInput";

export interface RadioGroupProps
  extends Omit<
      SpectrumRadioGroupProps,
      keyof StyleProps | "labelPosition" | "labelAlign" | "isEmphasized"
    >,
    Pick<
      TextInputProps,
      "fieldClassName" | "labelClassName" | "helpTextClassName" | "className"
    > {}
