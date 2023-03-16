import { Component } from "react";
import type { ControlType } from "constants/PropertyControlConstants";
import type { InputType } from "components/constants";
import type { ConditonalObject } from "reducers/evaluationReducers/formEvaluationReducer";
import type { DropdownOption } from "design-system-old";
import type { ViewTypes } from "./utils";
import type FeatureFlags from "entities/FeatureFlags";
// eslint-disable-next-line @typescript-eslint/ban-types
abstract class BaseControl<P extends ControlProps, S = {}> extends Component<
  P,
  S
> {
  abstract getControlType(): ControlType;
}

export type ComparisonOperations =
  | "EQUALS"
  | "NOT_EQUALS"
  | "LESSER"
  | "GREATER"
  | "IN"
  | "NOT_IN"
  | "FEATURE_FLAG";

export type HiddenType = boolean | Condition | ConditionObject;

export type ConditionObject = { conditionType: string; conditions: Conditions };

export type Condition = {
  path: string;
  comparison: ComparisonOperations;
  value: any;
  flagValue: keyof FeatureFlags;
};

export type Conditions = Array<Condition> | ConditionObject;
export interface ControlBuilder<T extends ControlProps> {
  buildPropertyControl(controlProps: T): JSX.Element;
}

export interface ControlProps extends ControlData, ControlFunctions {
  key?: string;
  extraData?: ControlData[];
  formName: string;
  nestedFormControl?: boolean;
}

export interface ControlData {
  id: string;
  label: string;
  alternateViewTypes?: ViewTypes[];
  tooltipText?: string | Record<string, string>;
  configProperty: string;
  controlType: ControlType;
  propertyValue?: any;
  isValid: boolean;
  validationMessage?: string;
  validationRegex?: string;
  dataType?: InputType;
  initialValue?:
    | string
    | boolean
    | number
    | Record<string, string>
    | Array<string>;
  info?: string; //helper text
  isRequired?: boolean;
  conditionals?: ConditonalObject; // Object that contains the conditionals config
  hidden?: HiddenType;
  placeholderText?: string | Record<string, string>;
  schema?: any;
  errorText?: string;
  showError?: boolean;
  encrypted?: boolean;
  subtitle?: string;
  showLineNumbers?: boolean;
  url?: string;
  urlText?: string;
  logicalTypes?: string[];
  comparisonTypes?: string[];
  nestedLevels?: number;
  customStyles?: any;
  propertyName?: string;
  identifier?: string;
  sectionName?: string;
  disabled?: boolean;
  staticDependencyPathList?: string[];
  validator?: (value: string) => { isValid: boolean; message: string };
  isSecretExistsPath?: string;
}
export type FormConfigType = Omit<ControlData, "configProperty"> & {
  configProperty?: string;
  children?: FormConfigType[];
  options?: DropdownOption[];
  fetchOptionsConditionally?: boolean;
};

export interface ControlFunctions {
  onPropertyChange?: (propertyName: string, propertyValue: string) => void;
}

export default BaseControl;
