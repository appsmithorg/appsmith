import { WidgetType } from "constants/WidgetConstants";
import WidgetFactory from "./WidgetFactory";
import {
  VALIDATION_TYPES,
  ValidationResponse,
  ValidationType,
  Validator,
} from "constants/WidgetValidation";
import { WidgetProps } from "widgets/BaseWidget";
import { DataTree } from "entities/DataTree/dataTreeFactory";

export const BASE_WIDGET_VALIDATION = {
  isLoading: VALIDATION_TYPES.BOOLEAN,
  isVisible: VALIDATION_TYPES.BOOLEAN,
  isDisabled: VALIDATION_TYPES.BOOLEAN,
};

export type WidgetPropertyValidationType = Record<
  string,
  ValidationType | Validator
>;

class ValidationFactory {
  static validationMap: Map<ValidationType, Validator> = new Map();

  static registerValidator(
    validationType: ValidationType,
    validator: Validator,
  ) {
    this.validationMap.set(validationType, validator);
  }

  static validateWidgetProperty(
    widgetType: WidgetType,
    property: string,
    value: any,
    props: WidgetProps,
    dataTree?: DataTree,
  ): ValidationResponse {
    // TODO WIDGETFACTORY
    const propertyValidationTypes = WidgetFactory.getWidgetPropertyValidationMap(
      widgetType,
    );
    const validationTypeOrValidator = propertyValidationTypes[property];
    let validator;

    if (typeof validationTypeOrValidator === "function") {
      validator = validationTypeOrValidator;
    } else {
      validator = this.validationMap.get(validationTypeOrValidator);
    }
    if (validator) {
      return validator(value, props, dataTree);
    } else {
      return { isValid: true, parsed: value };
    }
  }
}

export default ValidationFactory;
