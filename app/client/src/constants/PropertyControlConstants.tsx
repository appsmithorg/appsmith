import { getPropertyControlTypes } from "components/propertyControls";
const ControlTypes = getPropertyControlTypes();
export type ControlType = typeof ControlTypes[keyof typeof ControlTypes];

export type PropertyPaneSectionConfig = {
  sectionName: string;
  id?: string;
  children: PropertyPaneConfig[];
  hidden?: (props: any, propertyPath: string) => boolean;
  propertySectionPath?: string;
};

export type PanelConfig = {
  editableTitle: boolean;
  titlePropertyName: string;
  panelIdPropertyName: string;
  children: PropertyPaneConfig[];
  updateHook: (
    props: any,
    propertyPath: string,
    propertyValue: any,
  ) => Array<{ propertyPath: string; propertyValue: any }> | undefined;
};

export type PropertyPaneControlConfig = {
  id?: string;
  label: string;
  propertyName: string;
  helpText?: string;
  isJSConvertible?: boolean;
  customJSControl?: string;
  controlType: ControlType;
  validationMessage?: string;
  dataTreePath?: string;
  children?: PropertyPaneConfig[];
  panelConfig?: PanelConfig;
  updateHook?: (
    props: any,
    propertyName: string,
    propertyValue: any,
  ) => Array<{ propertyPath: string; propertyValue: any }> | undefined;
  hidden?: (props: any, propertyPath: string) => boolean;
  isBindProperty: boolean;
  isTriggerProperty: boolean;
  useValidationMessage?: boolean;
  additionalAutoComplete?: (
    props: any,
  ) => Record<string, Record<string, unknown>>;
};

export type PropertyPaneConfig =
  | PropertyPaneSectionConfig
  | PropertyPaneControlConfig;
