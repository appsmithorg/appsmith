import { RangeSliderWidgetProps } from "./widget";

export function minValueValidation(
  min: unknown,
  props: RangeSliderWidgetProps,
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
  props: RangeSliderWidgetProps,
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

export function stepSizeValidation(
  step: unknown,
  props: RangeSliderWidgetProps,
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

  const minRange = props.minRange;

  if (stepValue > minRange) {
    return {
      isValid: false,
      parsed: undefined,
      messages: [`This value must be less than or equal to minRange`],
    };
  }

  return {
    isValid: true,
    parsed: stepValue,
    messages: [""],
  };
}

export function startValueValidation(
  startValue: unknown,
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

  if (!_.isNil(minValue) && defaultStartValue < minValue) {
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
  endValue: unknown,
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

  if (!_.isNil(maxValue) && defaultEndValue > maxValue) {
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
  minRange: unknown,
  props: RangeSliderWidgetProps,
  _: any,
) {
  if (_.isNil(minRange) || minRange === "") {
    return {
      isValid: false,
      parsed: undefined,
      messages: ["This value is required"],
    };
  }

  const defaultMinRange = Number(minRange);
  const stepSize = props.step;

  if (!Number.isFinite(defaultMinRange)) {
    return {
      isValid: false,
      parsed: undefined,
      messages: ["This value must be a number"],
    };
  }

  const minValue = props.min;
  const maxValue = props.max;

  const sliderRange = maxValue - minValue;

  if (defaultMinRange > sliderRange) {
    return {
      isValid: false,
      parsed: undefined,
      messages: [`This value must be less than ${sliderRange}`],
    };
  }

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
