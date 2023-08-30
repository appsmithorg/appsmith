import type { INPUT_TYPES } from "./constants";
import type { IconName } from "@blueprintjs/icons";
import type { BaseInputComponentProps } from "widgets/BaseInputWidgetV2";
import type { BaseInputWidgetProps } from "widgets/BaseInputWidgetV2/widget/types";

export type InputType = (typeof INPUT_TYPES)[keyof typeof INPUT_TYPES];

export interface InputComponentProps extends BaseInputComponentProps {
  inputType: InputType;
  maxChars?: number;
  spellCheck?: boolean;
  maxNum?: number;
  minNum?: number;
  autoComplete?: string;
}

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
