import React from "react";
import BaseControl, { ControlProps } from "./BaseControl";
// import DynamicActionCreator from "components/editorComponents/DynamicActionCreator";
import { ActionCreator } from "components/editorComponents/actioncreator/ActionCreator";
import { ColumnProperties } from "components/designSystems/appsmith/TableComponent/Constants";

class ActionSelectorControl extends BaseControl<ControlProps> {
  handleValueUpdate = (newValue: string) => {
    const { propertyName } = this.props;
    this.updateProperty(propertyName, newValue, true);
  };

  render() {
    const { propertyValue } = this.props;
    /* The following code is very specific to the table columns */
    const { widgetProperties } = this.props;
    let additionalAutoComplete = {};
    if (
      this.props.customJSControl &&
      this.props.customJSControl === "COMPUTE_VALUE"
    ) {
      const columns: ColumnProperties[] = widgetProperties.primaryColumns || [];
      const currentRow: { [key: string]: any } = {};
      for (let i = 0; i < columns.length; i++) {
        currentRow[columns[i].id] = undefined;
      }
      additionalAutoComplete = { currentRow };
    }
    /* EO specific code */
    return (
      <ActionCreator
        value={propertyValue}
        isValid={this.props.isValid}
        validationMessage={this.props.errorMessage}
        onValueChange={this.handleValueUpdate}
        additionalAutoComplete={additionalAutoComplete}
      />
    );
  }

  static getControlType() {
    return "ACTION_SELECTOR";
  }
}

export default ActionSelectorControl;
