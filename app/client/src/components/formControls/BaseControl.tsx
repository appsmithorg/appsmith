import { Component } from "react";
import { ControlType } from "constants/PropertyControlConstants";
import { InputType } from "widgets/InputWidget";
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

export type HiddenType =
  | boolean
  | { path: string; comparison: ComparisonOperations; value: any };

export interface ControlBuilder<T extends ControlProps> {
  buildPropertyControl(controlProps: T): JSX.Element;
}

export interface ControlProps extends ControlData, ControlFunctions {
  key?: string;
  extraData?: ControlData[];
  formName: string;
}

export interface ControlData {
  id: string;
  label: string;
  configProperty: string;
  controlType: ControlType;
  propertyValue?: any;
  isValid: boolean;
  validationMessage?: string;
  validationRegex?: string;
  dataType?: InputType;
  isRequired?: boolean;
  hidden?: HiddenType;
  placeholderText?: string;
}

export interface ControlFunctions {
  onPropertyChange?: (propertyName: string, propertyValue: string) => void;
}

export const hidden = {
  conditionType: "AND",
  conditions: [
    {
      conditionType: "AND",
      conditions: [
        {
          path: 2,
          value: 2,
          comparison: "EQUALS",
        },
        {
          path: 2,
          value: 2,
          comparison: "EQUALS",
        },
      ],
    },
    {
      conditionType: "AND",
      conditions: [
        {
          conditionType: "OR",
          conditions: [
            {
              path: 2,
              value: 3,
              comparison: "EQUALS",
            },
          ],
        },
        {
          path: 3,
          value: 3,
          comparison: "EQUALS",
        },
      ],
    },
  ],
};

export default BaseControl;
