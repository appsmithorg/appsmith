import type { POSITION } from "@appsmith/wds";
import type { RadioProps as AriaRadioProps } from "react-aria-components";

export interface RadioProps extends AriaRadioProps {
  labelPosition?: keyof typeof POSITION;
}
