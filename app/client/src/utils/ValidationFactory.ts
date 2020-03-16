import { WidgetType } from "constants/WidgetConstants";
import WidgetFactory from "./WidgetFactory";
import {
  VALIDATION_TYPES,
  ValidationResponse,
  ValidationType,
  Validator,
} from "constants/WidgetValidation";

export const BASE_WIDGET_VALIDATION = {
  isLoading: VALIDATION_TYPES.BOOLEAN,
  isVisible: VALIDATION_TYPES.BOOLEAN,
  isDisabled: VALIDATION_TYPES.BOOLEAN,
};

export type WidgetPropertyValidationType = Record<string, ValidationType>;

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
  ): ValidationResponse {
    const propertyValidationTypes = WidgetFactory.getWidgetPropertyValidationMap(
      widgetType,
    );
    const validationType = propertyValidationTypes[property];
    const validator = this.validationMap.get(validationType);
    if (validator) {
      return validator(value);
    } else {
      return { isValid: true, parsed: value };
    }
  }
}

export default ValidationFactory;
