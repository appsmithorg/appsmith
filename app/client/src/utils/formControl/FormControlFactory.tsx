import { ControlType } from "constants/PropertyControlConstants";
import {
  ControlBuilder,
  ControlProps,
  ControlData,
} from "components/formControls/BaseControl";

// Static class to generate form controls based on the control type passed from JSON
class FormControlFactory {
  static controlMap: Map<ControlType, ControlBuilder<ControlProps>> = new Map();

  // Register a control builder for a given control type. called at the start of the application
  static registerControlBuilder(
    controlType: ControlType,
    controlBuilder: ControlBuilder<ControlProps>,
  ) {
    this.controlMap.set(controlType, controlBuilder);
  }

  // Called to create a control based on the control type passed from JSON
  static createControl(
    controlData: ControlData,
    formName: string,
    extraData?: ControlData[],
  ): JSX.Element {
    const controlBuilder = this.controlMap.get(controlData.controlType);

    if (controlBuilder) {
      const controlProps: ControlProps = {
        ...controlData,
        formName,
        extraData,
        key: controlData.id,
      };
      const control = controlBuilder.buildPropertyControl(controlProps);
      return control;
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

export default FormControlFactory;
