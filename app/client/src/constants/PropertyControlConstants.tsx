import { getPropertyControlTypes } from "components/propertyControls";
const ControlTypes = getPropertyControlTypes();
export type ControlType = typeof ControlTypes[keyof typeof ControlTypes];

export type PropertyPaneSectionConfig = {
  sectionName: string;
  id?: string;
  children: PropertyPaneConfig[];
};

export type PropertyPaneControlConfig = {
  id?: string;
  label: string;
  propertyName: string;
  helpText?: string;
  isJSConvertible?: boolean;
  controlType: ControlType;
  validationMessage?: string;
  dataTreePath?: string;
  children?: PropertyPaneConfig[];
  panelProps?: boolean;
  hidden?: (props: any) => boolean;
};

export type PropertyPaneConfig =
  | PropertyPaneSectionConfig
  | PropertyPaneControlConfig;
