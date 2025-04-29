import type { JSAction } from "entities/JSCollection";
import type { DropdownOption } from "@appsmith/ads-old";
import type { ActionRunBehaviourType } from "PluginActionEditor/constants/PluginActionConstants";

export interface OnUpdateSettingsProps {
  value: ActionRunBehaviourType;
  propertyName: string;
  action: JSAction;
}

export interface JSActionDropdownOption extends DropdownOption {
  data: JSAction | null;
}
