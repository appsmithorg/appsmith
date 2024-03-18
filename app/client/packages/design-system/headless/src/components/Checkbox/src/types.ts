import type { StyleProps } from "@react-types/shared";
import type { SpectrumCheckboxGroupProps } from "@react-types/checkbox";

import type { TextInputProps } from "../../TextInput";
import type { InlineLabelProps } from "./Checkbox";

export interface CheckboxGroupProps
  extends Omit<
      SpectrumCheckboxGroupProps,
      keyof StyleProps | "labelPosition" | "labelAlign" | "isEmphasized"
    >,
    Pick<
      TextInputProps,
      "fieldClassName" | "labelClassName" | "helpTextClassName" | "className"
    > {
  optionsLabelPosition?: InlineLabelProps["labelPosition"];
}
