import type { IconName } from "@blueprintjs/icons";

import type { InputComponentProps } from "../component/types";
import type { BaseInputWidgetProps } from "widgets/BaseInputWidgetV2/widget/types";

export interface InputWidgetProps extends BaseInputWidgetProps {
  defaultText?: string | number;
  inputText: string;
  inputType: InputComponentProps["inputType"];

  // input type text props
  isSpellCheck?: boolean;
  maxChars?: number;

  // input type  number- props
  maxNum?: number;
  minNum?: number;

  // icon props
  iconName?: IconName;
  iconAlign?: "left" | "right";
}

export type Validation = {
  errorMessage?: string;
  validationStatus?: InputComponentProps["validationStatus"];
};

export type KeyDownEvent = React.KeyboardEvent<
  HTMLTextAreaElement | HTMLInputElement
>;
