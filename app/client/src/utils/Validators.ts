import _ from "lodash";
import {
  VALIDATION_TYPES,
  ValidationType,
  Validator,
} from "../constants/WidgetValidation";

export const VALIDATORS: Record<ValidationType, Validator> = {
  [VALIDATION_TYPES.TEXT]: (value: any) => _.isString(value),
  [VALIDATION_TYPES.NUMBER]: (value: any) => _.isNumber(value),
  [VALIDATION_TYPES.BOOLEAN]: (value: any) => _.isBoolean(value),
  [VALIDATION_TYPES.OBJECT]: (value: any) => _.isObject(value),
  [VALIDATION_TYPES.TABLE_DATA]: (value: any) => {
    try {
      let data = value;
      if (_.isString(data)) {
        data = JSON.parse(data as string);
      }
      if (!Array.isArray(data)) return false;
      return _.every(data, datum => _.isObject(datum));
    } catch {
      return false;
    }
  },
};
