import type { Intent as BlueprintIntent } from "@blueprintjs/core";
import type { IconName } from "@blueprintjs/icons";

export interface DropdownOption {
  label?: string | number;
  value?: string | number;
  icon?: IconName;
  subText?: string;
  id?: string;
  onSelect?: (option: DropdownOption) => void;
  children?: DropdownOption[];
  intent?: BlueprintIntent;
}
