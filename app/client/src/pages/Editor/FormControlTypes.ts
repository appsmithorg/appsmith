import type { ControlProps } from "components/formControls/BaseControl";

export interface FormControlProps {
  config: ControlProps;
  formName: string;
  multipleConfig?: ControlProps[];
}
