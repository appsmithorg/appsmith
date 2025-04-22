import type { JSAction } from "entities/JSCollection";
import type { DropdownOption } from "@appsmith/ads-old";

export interface OnUpdateSettingsProps {
  value: boolean | number | string;
  propertyName: string;
  action: JSAction;
}

export interface JSActionDropdownOption extends DropdownOption {
  data: JSAction | null;
}
