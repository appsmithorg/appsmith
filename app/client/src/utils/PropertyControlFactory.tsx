import type { ControlType } from "constants/PropertyControlConstants";
import type {
  ControlBuilder,
  ControlProps,
  ControlFunctions,
  ControlData,
} from "components/propertyControls/BaseControl";
import type BaseControl from "components/propertyControls/BaseControl";
import { isArray } from "lodash";
import type { AdditionalDynamicDataTree } from "./autocomplete/customTreeTypeDefCreator";

class PropertyControlFactory {
  static controlMap: Map<ControlType, ControlBuilder<ControlProps>> = new Map();
  static controlUIToggleValidation: Map<
    ControlType,
    typeof BaseControl.canDisplayValueInUI
  > = new Map();
  static inputComputedValueMap: Map<
    ControlType,
    typeof BaseControl.getInputComputedValue
  > = new Map();

  static registerControlBuilder(
    controlType: ControlType,
    controlBuilder: ControlBuilder<ControlProps>,
    validationFn: typeof BaseControl.canDisplayValueInUI,
    inputComputedValueFn: typeof BaseControl.getInputComputedValue,
  ) {
    this.controlMap.set(controlType, controlBuilder);
    this.controlUIToggleValidation.set(controlType, validationFn);
    this.inputComputedValueMap.set(controlType, inputComputedValueFn);
  }

  static createControl(
    controlData: ControlData,
    controlFunctions: ControlFunctions,
    preferEditor: boolean,
    customEditor?: string,
    additionalAutoComplete?: AdditionalDynamicDataTree,
    hideEvaluatedValue?: boolean,
  ): JSX.Element {
    let controlBuilder;
    let evaluatedValue = controlData.evaluatedValue;

    if (preferEditor) {
      controlBuilder = customEditor
        ? this.controlMap.get(customEditor)
        : this.controlMap.get("CODE_EDITOR");
    } else {
      if (customEditor === "COMPUTE_VALUE" && isArray(evaluatedValue)) {
        evaluatedValue = evaluatedValue[0];
      }
      controlBuilder = this.controlMap.get(controlData.controlType);
    }

    if (controlBuilder) {
      const controlProps: ControlProps = {
        ...controlData,
        ...controlFunctions,
        evaluatedValue,
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
