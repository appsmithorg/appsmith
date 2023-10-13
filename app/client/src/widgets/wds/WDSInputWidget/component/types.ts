import type { BaseInputComponentProps } from "../../WDSBaseInputWidget";

import type { INPUT_TYPES } from "../constants";
import type { IconName } from "@blueprintjs/icons";
import type { KeyDownEvent } from "../widget/types";

export type InputType = (typeof INPUT_TYPES)[keyof typeof INPUT_TYPES];

export interface InputComponentProps extends BaseInputComponentProps {
  inputType: InputType;
  maxChars?: number;
  spellCheck?: boolean;
  maxNum?: number;
  minNum?: number;
  autoComplete?: string;
  iconAlign?: "left" | "right";
  iconName?: IconName;
  onKeyDown?: (e: KeyDownEvent) => void;
}
