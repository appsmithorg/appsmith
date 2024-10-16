import type { JSAction } from "entities/JSCollection";

export interface OnUpdateSettingsProps {
  value: boolean | number;
  propertyName: string;
  action: JSAction;
}
