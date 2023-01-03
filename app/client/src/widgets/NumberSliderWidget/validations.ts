import { NumberSliderWidgetProps } from "./widget";

export function minValueValidation(
  min: unknown,
  props: NumberSliderWidgetProps,
  _: any,
) {
  if (_.isNil(min) || min === "") {
    return {
      isValid: false,
      parsed: undefined,
      messages: ["This value is required"],
    };
  }

  const minValue = Number(min);
  const maxValue = props.max;

  if (!Number.isFinite(minValue)) {
    return {
      isValid: false,
      parsed: undefined,
      messages: ["This value must be a number"],
    };
  }

  if (!_.isNil(maxValue) && minValue >= maxValue) {
    return {
      isValid: false,
      parsed: undefined,
      messages: ["This value must be less than max value"],
    };
  }

  return {
    isValid: true,
    parsed: minValue,
    messages: [""],
  };
}

export function maxValueValidation(
  max: unknown,
  props: NumberSliderWidgetProps,
  _: any,
) {
  if (_.isNil(max) || max === "") {
    return {
      isValid: false,
      parsed: undefined,
      messages: ["This value is required"],
    };
  }

  const maxValue = Number(max);
  const minValue = props.min;

  if (!Number.isFinite(maxValue)) {
    return {
      isValid: false,
      parsed: undefined,
      messages: ["This value must be a number"],
    };
  }

  if (!_.isNil(minValue) && maxValue <= minValue) {
    return {
      isValid: false,
      parsed: undefined,
      messages: ["This value must be greater than min value"],
    };
  }

  return {
    isValid: true,
    parsed: maxValue,
    messages: [""],
  };
}

export function defaultValueValidation(
  value: unknown,
  props: NumberSliderWidgetProps,
  _: any,
) {
  if (_.isNil(value) || value === "") {
    return {
      isValid: true,
      parsed: undefined,
      messages: [""],
    };
  }

  const maxValue = props.max;
  const minValue = props.min;
  const defaultValue = Number(value);

  if (!Number.isFinite(defaultValue)) {
    return {
      isValid: false,
      parsed: undefined,
      messages: ["This value must be a number"],
    };
  }

  if (!_.isNil(minValue) && defaultValue < minValue) {
    return {
      isValid: false,
      parsed: undefined,
      messages: ["This value must be greater than or equal to the min value"],
    };
  }

  if (!_.isNil(maxValue) && defaultValue > maxValue) {
    return {
      isValid: false,
      parsed: undefined,
      messages: ["This value must be less than or equal to the max value"],
    };
  }

  return {
    isValid: true,
    parsed: defaultValue,
    messages: [""],
  };
}

export function stepSizeValidation(
  step: unknown,
  props: NumberSliderWidgetProps,
  _: any,
) {
  if (_.isNil(step) || step === "") {
    return {
      isValid: false,
      parsed: undefined,
      messages: ["This value is required"],
    };
  }

  const stepValue = Number(step);

  if (!Number.isFinite(stepValue)) {
    return {
      isValid: false,
      parsed: undefined,
      messages: ["This value must be a number"],
    };
  }

  if (stepValue < 0.1) {
    return {
      isValid: false,
      parsed: undefined,
      messages: ["This value must be greater than 0.1"],
    };
  }

  const minValue = props.min;
  const maxValue = props.max;

  const sliderRange = maxValue - minValue;

  if (stepValue > sliderRange) {
    return {
      isValid: false,
      parsed: undefined,
      messages: [`This value must be less than ${sliderRange}`],
    };
  }

  return {
    isValid: true,
    parsed: stepValue,
    messages: [""],
  };
}
