import { Component } from "react";
import { ControlType } from "constants/PropertyControlConstants";
import { InputType } from "components/constants";
import {
  ConditonalObject,
  DynamicValues,
} from "reducers/evaluationReducers/formEvaluationReducer";
import { DropdownOption } from "components/ads/Dropdown";
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
  | "NOT_IN";

export type HiddenType = boolean | Condition | ConditionObject;

export type ConditionObject = { conditionType: string; conditions: Conditions };

export type Condition = {
  path: string;
  comparison: ComparisonOperations;
  value: any;
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
  displayType?: "UI" | "JSON"; //used for switch to JSON view
  tooltipText?: string;
  configProperty: string;
  controlType: ControlType;
  propertyValue?: any;
  isValid: boolean;
  validationMessage?: string;
  validationRegex?: string;
  dataType?: InputType;
  initialValue?: string | boolean | number | Record<string, string>;
  info?: string; //helper text
  isRequired?: boolean;
  conditionals?: ConditonalObject; // Object that contains the conditionals config
  hidden?: HiddenType;
  placeholderText?: string;
  schema?: any;
  errorText?: string;
  showError?: boolean;
  encrypted?: boolean;
  subtitle?: string;
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
  dynamicFetchedValues?: DynamicValues; // Object that holds the output of the dynamic fetched values
}
export type FormConfig = Omit<ControlData, "configProperty"> & {
  configProperty?: string;
  children?: FormConfig[];
  options?: DropdownOption[];
};

export interface ControlFunctions {
  onPropertyChange?: (propertyName: string, propertyValue: string) => void;
}

export default BaseControl;
