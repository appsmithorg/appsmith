import { EditorTheme } from "components/editorComponents/CodeEditor/EditorConfig";

export const THEME = EditorTheme.LIGHT;

export enum ActionRunBehaviour {
  ON_PAGE_LOAD = "ON_PAGE_LOAD",
  MANUAL = "MANUAL",
  AUTOMATIC = "AUTOMATIC",
}

export type ActionRunBehaviourType = `${ActionRunBehaviour}`;

export interface PluginActionSettingsConfigChildren {
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

export interface PluginActionSettingsConfig {
  sectionName: string;
  id: number;
  children: PluginActionSettingsConfigChildren[];
}
