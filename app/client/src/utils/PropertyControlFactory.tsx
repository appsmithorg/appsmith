import { ControlType } from "constants/PropertyControlConstants";
import React from "react";
import {
  ControlBuilder,
  ControlProps,
  ControlData,
  ControlFunctions,
} from "components/propertyControls/BaseControl";

class PropertyControlFactory {
  static controlMap: Map<ControlType, ControlBuilder<ControlProps>> = new Map();

  static registerControlBuilder(
    controlType: ControlType,
    controlBuilder: ControlBuilder<ControlProps>,
  ) {
    this.controlMap.set(controlType, controlBuilder);
  }

  static createControl(
    controlData: ControlData,
    controlFunctions: ControlFunctions,
    preferEditor: boolean,
  ): JSX.Element {
    const controlBuilder = preferEditor
      ? this.controlMap.get("CODE_EDITOR")
      : this.controlMap.get(controlData.controlType);
    if (controlBuilder) {
      const controlProps: ControlProps = {
        ...controlData,
        ...controlFunctions,
        key: controlData.id,
      };
      const control = controlBuilder.buildPropertyControl(controlProps);
      const className = controlProps.label
        .split(" ")
        .join("")
        .toLowerCase();
      return (
        <div
          key={controlProps.id}
          className={`t--property-control-${className}`}
        >
          {control}
        </div>
      );
    } else {
      const ex: ControlCreationException = {
        message:
          "Control Builder not registered for control type " +
          controlData.controlType,
      };
      throw ex;
    }
  }

  static getControlTypes(): ControlType[] {
    return Array.from(this.controlMap.keys());
  }
}

export interface ControlCreationException {
  message: string;
}

export default PropertyControlFactory;
