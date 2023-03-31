/***
 * Controls are rendered in the property panel from the property config
 * Controls are higher order components that update a widgets property
 */
import { Component } from "react";
import type { EditorTheme } from "components/editorComponents/CodeEditor/EditorConfig";
import type { PropertyPaneControlConfig } from "constants/PropertyControlConstants";
import type { CodeEditorExpected } from "components/editorComponents/CodeEditor";
import type { AdditionalDynamicDataTree } from "utils/autocomplete/customTreeTypeDefCreator";

// eslint-disable-next-line @typescript-eslint/ban-types
class BaseControl<P extends ControlProps, S = {}> extends Component<P, S> {
  shoudUpdateProperty(propertyValue: unknown) {
    return !(
      (this.props.propertyValue === undefined &&
        propertyValue === this.props.defaultValue) ||
      !(this.props.propertyValue !== propertyValue)
    );
  }

  updateProperty(
    propertyName: string,
    propertyValue: any,
    isUpdatedViaKeyboard?: boolean,
  ) {
    if (
      this.shoudUpdateProperty(propertyValue) &&
      this.props.onPropertyChange
    ) {
      this.props.onPropertyChange(
        propertyName,
        propertyValue,
        isUpdatedViaKeyboard,
      );
    }
  }

  deleteProperties(propertyPaths: string[]) {
    if (this.props.deleteProperties) {
      this.props.deleteProperties(propertyPaths);
    }
  }

  batchUpdatePropertiesWithAssociatedUpdates = (
    updates: { propertyName: string; propertyValue: any }[],
  ) => {
    if (this.props.onBatchUpdateWithAssociatedUpdates) {
      this.props.onBatchUpdateWithAssociatedUpdates(
        updates.filter(({ propertyValue }) =>
          this.shoudUpdateProperty(propertyValue),
        ),
      );
    }
  };

  batchUpdateProperties = (updates: Record<string, unknown>) => {
    if (this.props.onBatchUpdateProperties) {
      this.props.onBatchUpdateProperties(updates);
    }
  };
  static getControlType() {
    return "BASE_CONTROL";
  }

  // Checks whether a particular value can be displayed UI from JS edit mode
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  static canDisplayValueInUI(config: ControlData, value: any): boolean {
    return false;
  }

  // Only applicable for JSONFormComputeControl & ComputeTablePropertyControl
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  static getInputComputedValue(value: string, widgetName: string): string {
    return "";
  }
}

export interface ControlBuilder<T extends ControlProps> {
  buildPropertyControl(controlProps: T): JSX.Element;
}

export interface ControlProps extends ControlData, ControlFunctions {
  key?: string;
  additionalAutoComplete?: AdditionalDynamicDataTree;
}
export interface ControlData
  extends Omit<PropertyPaneControlConfig, "additionalAutoComplete" | "label"> {
  propertyValue?: any;
  defaultValue?: any;
  errorMessage?: string;
  expected?: CodeEditorExpected;
  evaluatedValue: any;
  widgetProperties: any;
  useValidationMessage?: boolean;
  parentPropertyName: string;
  parentPropertyValue: unknown;
  additionalDynamicData: AdditionalDynamicDataTree;
  label: string;
  additionalControlData?: Record<string, unknown>;
}
export interface ControlFunctions {
  onPropertyChange?: (
    propertyName: string,
    propertyValue: string,
    isUpdatedViaKeyboard?: boolean,
  ) => void;

  onBatchUpdateWithAssociatedUpdates?: (
    updates: {
      propertyName: string;
      propertyValue: string;
    }[],
    isUpdatedViaKeyboard?: boolean,
  ) => void;
  onBatchUpdateProperties?: (updates: Record<string, unknown>) => void;
  openNextPanel: (props: any) => void;
  deleteProperties: (propertyPaths: string[]) => void;
  theme: EditorTheme;
  hideEvaluatedValue?: boolean;
}

export default BaseControl;
