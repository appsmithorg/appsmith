import { ControlType } from "constants/PropertyControlConstants";
import {
  ControlBuilder,
  ControlProps,
  ControlData,
} from "components/formControls/BaseControl";

class FormControlFacotory {
  static controlMap: Map<ControlType, ControlBuilder<ControlProps>> = new Map();

  static registerControlBuilder(
    controlType: ControlType,
    controlBuilder: ControlBuilder<ControlProps>,
  ) {
    this.controlMap.set(controlType, controlBuilder);
  }

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

export default FormControlFacotory;
