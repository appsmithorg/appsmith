import type { IconProps } from "@appsmith/wds";
import type { InputType } from "widgets/wds/WDSBaseInputWidget/types";

import type { BaseInputComponentProps } from "../../WDSBaseInputWidget";

export interface InputComponentProps extends BaseInputComponentProps {
  inputType: InputType;
  maxChars?: number;
  spellCheck?: boolean;
  maxNum?: number;
  minNum?: number;
  autoComplete?: string;
  iconAlign?: "left" | "right";
  iconName?: IconProps["name"];
  onPaste?: (event: React.ClipboardEvent<HTMLInputElement>) => void;
}
