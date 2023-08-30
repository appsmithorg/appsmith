import type { BaseInputComponentProps } from "widgets/BaseInputWidgetV2";

import type { INPUT_TYPES } from "../constants";
<<<<<<< HEAD
=======
import type { IconName } from "@blueprintjs/icons";
import type { KeyDownEvent } from "../widget/types";
>>>>>>> 52714a8152 (fix bugs)

export type InputType = (typeof INPUT_TYPES)[keyof typeof INPUT_TYPES];

export interface InputComponentProps extends BaseInputComponentProps {
  inputType: InputType;
  maxChars?: number;
  spellCheck?: boolean;
  maxNum?: number;
  minNum?: number;
  autoComplete?: string;
<<<<<<< HEAD
=======
  iconAlign?: "left" | "right";
  iconName?: IconName;
  onKeyDown?: (e: KeyDownEvent) => void;
>>>>>>> 52714a8152 (fix bugs)
}
