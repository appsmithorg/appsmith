/***
 * Controls are rendered in the property panel from the property config
 * Controls are higher order components that update a widgets property
 */
import { Component } from "react";
import _ from "lodash";
import { EditorTheme } from "components/editorComponents/CodeEditor/EditorConfig";
import { PropertyPaneControlConfig } from "constants/PropertyControlConstants";
import { CodeEditorExpected } from "components/editorComponents/CodeEditor";

// eslint-disable-next-line @typescript-eslint/ban-types
class BaseControl<P extends ControlProps, S = {}> extends Component<P, S> {
  updateProperty(
    propertyName: string,
    propertyValue: any,
    isUpdatedViaKeyboard?: boolean,
  ) {
    if (!_.isNil(this.props.onPropertyChange))
      this.props.onPropertyChange(
        propertyName,
        propertyValue,
        isUpdatedViaKeyboard,
      );
  }
  deleteProperties(propertyPaths: string[]) {
    if (this.props.deleteProperties) {
      this.props.deleteProperties(propertyPaths);
    }
  }
  batchUpdateProperties = (updates: Record<string, unknown>) => {
    if (this.props.onBatchUpdateProperties) {
      this.props.onBatchUpdateProperties(updates);
    }
  };
}

export interface ControlBuilder<T extends ControlProps> {
  buildPropertyControl(controlProps: T): JSX.Element;
}

export interface ControlProps extends ControlData, ControlFunctions {
  key?: string;
  additionalAutoComplete?: Record<string, Record<string, unknown>>;
}
export interface ControlData
  extends Omit<PropertyPaneControlConfig, "additionalAutoComplete"> {
  propertyValue?: any;
  errorMessage?: string;
  expected?: CodeEditorExpected;
  evaluatedValue: any;
  widgetProperties: any;
  useValidationMessage?: boolean;
  parentPropertyName: string;
  parentPropertyValue: unknown;
  additionalDynamicData: Record<string, Record<string, unknown>>;
}
export interface ControlFunctions {
  onPropertyChange?: (
    propertyName: string,
    propertyValue: string,
    isUpdatedViaKeyboard?: boolean,
  ) => void;
  onBatchUpdateProperties?: (updates: Record<string, unknown>) => void;
  openNextPanel: (props: any) => void;
  deleteProperties: (propertyPaths: string[]) => void;
  theme: EditorTheme;
  hideEvaluatedValue?: boolean;
}

export default BaseControl;
