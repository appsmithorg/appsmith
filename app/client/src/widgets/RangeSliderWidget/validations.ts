import { RangeSliderWidgetProps } from "./widget";

export function minValueValidation(
  min: any,
  props: RangeSliderWidgetProps,
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
  props: RangeSliderWidgetProps,
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

export function stepSizeValidation(
  stepSize: any,
  props: RangeSliderWidgetProps,
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

export function startValueValidation(
  startValue: any,
  props: RangeSliderWidgetProps,
  _: any,
) {
  if (_.isNil(startValue) || startValue === "") {
    return {
      isValid: true,
      parsed: undefined,
      messages: [""],
    };
  }

  const defaultStartValue = Number(startValue);
  const defaultEndValue = props.defaultEndValue;
  const minValue = props.min;

  if (!Number.isFinite(defaultStartValue)) {
    return {
      isValid: false,
      parsed: undefined,
      messages: ["This value must be a number"],
    };
  }

  if (minValue !== undefined && defaultStartValue < minValue) {
    return {
      isValid: false,
      parsed: undefined,
      messages: ["This value must be greater than min value"],
    };
  }

  if (defaultEndValue !== undefined && defaultStartValue >= defaultEndValue) {
    return {
      isValid: false,
      parsed: undefined,
      messages: ["This value must be less than defaultEnd value"],
    };
  }

  return {
    isValid: true,
    parsed: defaultStartValue,
    messages: [""],
  };
}

export function endValueValidation(
  endValue: any,
  props: RangeSliderWidgetProps,
  _: any,
) {
  if (_.isNil(endValue) || endValue === "") {
    return {
      isValid: true,
      parsed: undefined,
      messages: [""],
    };
  }

  const defaultEndValue = Number(endValue);
  const defaultStartValue = props.defaultStartValue;
  const maxValue = props.max;

  if (!Number.isFinite(defaultEndValue)) {
    return {
      isValid: false,
      parsed: undefined,
      messages: ["This value must be a number"],
    };
  }

  if (maxValue !== undefined && defaultEndValue > maxValue) {
    return {
      isValid: false,
      parsed: undefined,
      messages: ["This value must be less than max value"],
    };
  }

  if (defaultStartValue !== undefined && defaultEndValue <= defaultStartValue) {
    return {
      isValid: false,
      parsed: undefined,
      messages: ["This value must be greater than defaultStart value"],
    };
  }

  return {
    isValid: true,
    parsed: defaultEndValue,
    messages: [""],
  };
}

export function minRangeValidation(
  minRange: any,
  props: RangeSliderWidgetProps,
  _: any,
) {
  if (_.isNil(minRange) || minRange === "") {
    return {
      isValid: true,
      parsed: undefined,
      messages: [""],
    };
  }

  const defaultMinRange = Number(minRange);
  const stepSize = props.step;

  if (defaultMinRange < 0.1) {
    return {
      isValid: false,
      parsed: undefined,
      messages: ["This value must be greater than 0.1"],
    };
  }

  if (defaultMinRange < stepSize) {
    return {
      isValid: false,
      parsed: undefined,
      messages: ["This value must be greater than or equal to step size"],
    };
  }

  return {
    isValid: true,
    parsed: defaultMinRange,
    messages: [""],
  };
}
