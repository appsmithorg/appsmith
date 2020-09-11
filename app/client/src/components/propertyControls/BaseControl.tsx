/***
 * Controls are rendered in the property panel from the property config
 * Controls are higher order components that update a widgets property
 */
import { Component } from "react";
import _ from "lodash";
import { ControlType } from "constants/PropertyControlConstants";
import { WidgetProps } from "widgets/BaseWidget";
import { PropertySection } from "reducers/entityReducers/propertyPaneConfigReducer";
import { ChildProperties } from "pages/Editor/PropertyPane/PropertiesEditor";

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

export interface ControlData {
  id: string;
  label: string;
  propertyName: string;
  helpText?: string;
  isJSConvertible?: boolean;
  controlType: ControlType;
  propertyValue?: any;
  isValid: boolean;
  errorMessage?: string;
  expected: string;
  evaluatedValue: any;
  validationMessage?: string;
  dataTreePath?: string;
  widgetProperties: WidgetProps;
  childrenProperties?: PropertySection[];
  parentPropertyName?: string;
  parentPropertyValue: any;
}

export interface ControlFunctions {
  onPropertyChange?: (propertyName: string, propertyValue: string) => void;
  openNextPanel: (childProperties: ChildProperties) => void;
}

export default BaseControl;
