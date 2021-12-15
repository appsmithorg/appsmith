import { ControlType } from "constants/PropertyControlConstants";
import {
  ControlBuilder,
  ControlProps,
  ControlFunctions,
  ControlData,
} from "components/propertyControls/BaseControl";

const THEME_BOUND_CONTROLS = [
  "COLOR_PICKER",
  "BOX_SHADOW_OPTIONS",
  "BORDER_RADIUS_OPTIONS",
];

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
    customEditor?: string,
    additionalAutoComplete?: Record<string, Record<string, unknown>>,
    hideEvaluatedValue?: boolean,
  ): JSX.Element {
    let controlBuilder;
    const isThemeBoundControl = THEME_BOUND_CONTROLS.indexOf(
      controlData.controlType,
    );

    if (preferEditor && !isThemeBoundControl) {
      controlBuilder = customEditor
        ? this.controlMap.get(customEditor)
        : this.controlMap.get("CODE_EDITOR");
    } else {
      controlBuilder = this.controlMap.get(controlData.controlType);
    }

    if (controlBuilder) {
      const controlProps: ControlProps = {
        ...controlData,
        ...controlFunctions,
        key: controlData.id,
        customJSControl: customEditor,
        additionalAutoComplete,
        hideEvaluatedValue,
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

export default PropertyControlFactory;
