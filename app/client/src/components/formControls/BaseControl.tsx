import { Component } from "react";
import type { ControlType } from "constants/PropertyControlConstants";
import type { InputType } from "components/constants";
import type { ConditonalObject } from "reducers/evaluationReducers/formEvaluationReducer";
import type { DropdownOption } from "@appsmith/ads-old";
import type { ViewTypes } from "./utils";
import type { FeatureFlag } from "ee/entities/FeatureFlag";
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
  | "FEATURE_FLAG"
  | "VIEW_MODE"
  | "DEFINED_AND_NOT_EQUALS";

export enum ComparisonOperationsEnum {
  VIEW_MODE = "VIEW_MODE",
}

export type HiddenType = boolean | Condition | ConditionObject;

export interface ConditionObject {
  conditionType: string;
  conditions: Conditions;
}

export interface Condition {
  path: string;
  comparison: ComparisonOperations;
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value: any;
  flagValue: FeatureFlag;
}

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
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  customStyles?: any;
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  sectionStyles?: any;
  propertyName?: string;
  identifier?: string;
  sectionName?: string;
  disabled?: boolean;
  staticDependencyPathList?: string[];
  validator?: (value: string) => { isValid: boolean; message: string };
  isSecretExistsPath?: string;
  addMoreButtonLabel?: string;
  datasourceId?: string;
  workspaceId?: string;
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
