/***
 * Controls are rendered in the property panel from the property config
 * Controls are higher order components that update a widgets property
 */
import { Component } from "react";
import type { EditorTheme } from "components/editorComponents/CodeEditor/EditorConfig";
import type { PropertyPaneControlConfig } from "constants/PropertyControlConstants";
import type { CodeEditorExpected } from "components/editorComponents/CodeEditor";
import type { AdditionalDynamicDataTree } from "utils/autocomplete/customTreeTypeDefCreator";

export type ControlMethods = Record<
  "canDisplayValueInUI" | "shouldValidateValueOnDynamicPropertyOff",
  | typeof BaseControl.canDisplayValueInUI
  | typeof BaseControl.shouldValidateValueOnDynamicPropertyOff
>;

// eslint-disable-next-line @typescript-eslint/ban-types
class BaseControl<P extends ControlProps, S = {}> extends Component<P, S> {
  shouldUpdateProperty(newValue: unknown) {
    const { defaultValue, propertyValue: oldValue } = this.props;

    if (oldValue === undefined && newValue === defaultValue) return false;

    if (newValue === oldValue) return false;

    return true;
  }

  updateProperty(
    propertyName: string,
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    propertyValue: any,
    isUpdatedViaKeyboard?: boolean,
  ) {
    if (
      this.shouldUpdateProperty(propertyValue) &&
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
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    updates: { propertyName: string; propertyValue: any }[],
  ) => {
    if (this.props.onBatchUpdateWithAssociatedUpdates) {
      this.props.onBatchUpdateWithAssociatedUpdates(
        updates.filter(({ propertyValue }) =>
          this.shouldUpdateProperty(propertyValue),
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
  static canDisplayValueInUI(config: ControlData, value: any): boolean {
    return false;
  }

  //checks whether we need to validate the value when swtiching from js mode to non js mode
  static shouldValidateValueOnDynamicPropertyOff(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    config?: ControlData,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
    value?: any,
  ): boolean {
    return true;
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
  isSearchResult?: boolean;
}
export interface ControlData
  extends Omit<PropertyPaneControlConfig, "additionalAutoComplete" | "label"> {
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  propertyValue?: any;
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  defaultValue?: any;
  errorMessage?: string;
  expected?: CodeEditorExpected;
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  evaluatedValue: any;
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    isDynamicPropertyPath?: boolean,
  ) => void;

  onBatchUpdateWithAssociatedUpdates?: (
    updates: {
      propertyName: string;
      propertyValue: string;
    }[],
    isUpdatedViaKeyboard?: boolean,
  ) => void;
  onBatchUpdateProperties?: (updates: Record<string, unknown>) => void;
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  openNextPanel: (props: any) => void;
  deleteProperties: (propertyPaths: string[]) => void;
  theme: EditorTheme;
  hideEvaluatedValue?: boolean;
}

export default BaseControl;
