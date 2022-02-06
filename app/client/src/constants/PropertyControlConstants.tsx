import { getPropertyControlTypes } from "components/propertyControls";
import {
  ValidationResponse,
  ValidationTypes,
} from "constants/WidgetValidation";
import { EvaluationSubstitutionType } from "entities/DataTree/dataTreeFactory";
import { CodeEditorExpected } from "components/editorComponents/CodeEditor";
import { UpdateWidgetPropertyPayload } from "actions/controlActions";
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
  updateRelatedWidgetProperties?: (
    propertyName: string,
    propertyValue: any,
    props: any,
  ) => UpdateWidgetPropertyPayload[];
  updateHook?: (
    props: any,
    propertyName: string,
    propertyValue: any,
  ) => Array<{ propertyPath: string; propertyValue: any }> | undefined;
  hidden?: (props: any, propertyPath: string) => boolean;
  isBindProperty: boolean;
  isTriggerProperty: boolean;
  validation?: ValidationConfig;
  useValidationMessage?: boolean;
  additionalAutoComplete?: (
    props: any,
  ) => Record<string, Record<string, unknown>>;
  evaluationSubstitutionType?: EvaluationSubstitutionType;
  dependencies?: string[];
  expected?: CodeEditorExpected;
};

type ValidationConfigParams = {
  min?: number; // min allowed for a number
  max?: number; // max allowed for a number
  natural?: boolean; // is a positive integer
  default?: unknown; // default for any type
  unique?: boolean | string[]; // unique in an array (string if a particular path is unique)
  required?: boolean; // required type
  // required is now used to check if value is an empty string.
  requiredKey?: boolean; //required key
  regex?: RegExp; // validator regex for text type
  allowedKeys?: Array<{
    // Allowed keys in an object type
    name: string;
    type: ValidationTypes;
    params?: ValidationConfigParams;
  }>;
  allowedValues?: unknown[]; // Allowed values in a string and array type
  children?: ValidationConfig; // Children configurations in an ARRAY or OBJECT_ARRAY type
  fn?: (
    value: unknown,
    props: any,
    _?: any,
    moment?: any,
  ) => ValidationResponse; // Function in a FUNCTION type
  fnString?: string; // AUTO GENERATED, SHOULD NOT BE SET BY WIDGET DEVELOPER
  expected?: CodeEditorExpected; // FUNCTION type expected type and example
  strict?: boolean; //for strict string validation of TEXT type
  ignoreCase?: boolean; //to ignore the case of key
  type?: ValidationTypes; // Used for ValidationType.TABLE_PROPERTY to define sub type
  params?: ValidationConfigParams; // Used for ValidationType.TABLE_PROPERTY to define sub type params
};

export type ValidationConfig = {
  type: ValidationTypes;
  params?: ValidationConfigParams;
};

export type PropertyPaneConfig =
  | PropertyPaneSectionConfig
  | PropertyPaneControlConfig;

export interface ActionValidationConfigMap {
  [configPropety: string]: ValidationConfig;
}
