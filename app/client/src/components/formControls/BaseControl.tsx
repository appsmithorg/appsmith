import { Component } from "react";
import { ControlType } from "constants/PropertyControlConstants";
import { InputType } from "widgets/InputWidget";

abstract class BaseControl<P extends ControlProps, S = {}> extends Component<
  P,
  S
> {
  abstract getControlType(): ControlType;
}

export interface ControlBuilder<T extends ControlProps> {
  buildPropertyControl(controlProps: T): JSX.Element;
}

export interface ControlProps extends ControlData, ControlFunctions {
  key?: string;
  extraData?: ControlData[];
}

export interface ControlData {
  id: string;
  label: string;
  configProperty: string;
  helpText?: string;
  isJSConvertible?: boolean;
  controlType: ControlType;
  propertyValue?: any;
  isValid: boolean;
  validationMessage?: string;
  dataType?: InputType;
  isRequired?: boolean;
}

export interface ControlFunctions {
  onPropertyChange?: (propertyName: string, propertyValue: string) => void;
}

export default BaseControl;
