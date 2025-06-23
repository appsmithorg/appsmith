import { EditorTheme } from "components/editorComponents/CodeEditor/EditorConfig";

export const THEME = EditorTheme.LIGHT;

export enum ActionRunBehaviour {
  ON_PAGE_LOAD = "ON_PAGE_LOAD",
  MANUAL = "MANUAL",
  AUTOMATIC = "AUTOMATIC",
  ON_PAGE_UNLOAD = "ON_PAGE_UNLOAD",
}

export type ActionRunBehaviourType = `${ActionRunBehaviour}`;

export interface ActionSettingsConfigChildren {
  label: string;
  configProperty: string;
  controlType: string;
  initialValue?: string | boolean;
  options?: Array<{ label: string; value: string }>;
  tooltipText?: string;
  placeholder?: string;
  dataType?: string;
  subtitle?: string;
  name?: string;
}

export interface ActionSettingsConfig {
  sectionName: string;
  id: number;
  children: ActionSettingsConfigChildren[];
}
