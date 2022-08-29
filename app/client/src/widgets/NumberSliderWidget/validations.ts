import { NumberSliderWidgetProps } from "./widget";

export function minValueValidation(
  min: any,
  props: NumberSliderWidgetProps,
  _: any,
) {
  if (_.isNil(min) || min === "") {
    return {
      isValid: true,
      parsed: undefined,
      messages: [""],
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

  if (maxValue !== undefined && minValue >= maxValue) {
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
  max: any,
  props: NumberSliderWidgetProps,
  _: any,
) {
  if (_.isNil(max) || max === "") {
    return {
      isValid: true,
      parsed: undefined,
      messages: [""],
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

  if (minValue !== undefined && maxValue <= minValue) {
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
  value: any,
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

  if (minValue !== undefined && defaultValue < minValue) {
    return {
      isValid: false,
      parsed: undefined,
      messages: ["This value must be greater than min value"],
    };
  }

  if (maxValue !== undefined && defaultValue > maxValue) {
    return {
      isValid: false,
      parsed: undefined,
      messages: ["This value must be less than max value"],
    };
  }

  return {
    isValid: true,
    parsed: defaultValue,
    messages: [""],
  };
}

export function stepSizeValidation(
  stepSize: any,
  props: NumberSliderWidgetProps,
  _: any,
) {
  if (_.isNil(stepSize) || stepSize === "") {
    return {
      isValid: true,
      parsed: undefined,
      messages: [""],
    };
  }

  const step = Number(stepSize);

  if (!Number.isFinite(step)) {
    return {
      isValid: false,
      parsed: undefined,
      messages: ["This value must be a number"],
    };
  }

  if (step < 0.1) {
    return {
      isValid: false,
      parsed: undefined,
      messages: ["This value must be greater than 0.1"],
    };
  }

  const minValue = props.min;
  const maxValue = props.max;

  const sliderRange = maxValue - minValue;

  if (stepSize > sliderRange) {
    return {
      isValid: false,
      parsed: undefined,
      messages: [`This value must be less than ${sliderRange}`],
    };
  }

  return {
    isValid: true,
    parsed: step,
    messages: [""],
  };
}
