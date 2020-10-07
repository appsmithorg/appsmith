/***
 * Controls are rendered in the property panel from the property config
 * Controls are higher order components that update a widgets property
 */
import { Component } from "react";
import _ from "lodash";
import { PropertyPaneControlConfig } from "constants/PropertyControlConstants";

abstract class BaseControl<P extends ControlProps, S = {}> extends Component<
  P,
  S
> {
  updateProperty(propertyName: string, propertyValue: any) {
    if (!_.isNil(this.props.onPropertyChange))
      this.props.onPropertyChange(propertyName, propertyValue);
  }
}

export interface ControlBuilder<T extends ControlProps> {
  buildPropertyControl(controlProps: T): JSX.Element;
}

export interface ControlProps extends ControlData, ControlFunctions {
  key?: string;
}
export interface ControlData extends PropertyPaneControlConfig {
  propertyValue?: any;
  isValid: boolean;
  errorMessage?: string;
  expected: string;
  evaluatedValue: any;
  validationMessage?: string;
}
export interface ControlFunctions {
  onPropertyChange?: (propertyName: string, propertyValue: string) => void;
}

export default BaseControl;
