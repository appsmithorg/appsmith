import {
  VALIDATION_TYPES,
  ValidationType,
  Validator,
} from "constants/WidgetValidation";

export const BASE_WIDGET_VALIDATION = {
  isLoading: VALIDATION_TYPES.BOOLEAN,
  isVisible: VALIDATION_TYPES.BOOLEAN,
  isDisabled: VALIDATION_TYPES.BOOLEAN,
};

export type WidgetPropertyValidationType = Record<
  string,
  ValidationType | Validator
>;
