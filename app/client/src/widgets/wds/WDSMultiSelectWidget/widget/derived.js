/* eslint-disable @typescript-eslint/no-unused-vars*/
export default {
  getOptions: (props, moment, _) => {
    let labels = [],
      values = [],
      sourceData = props.sourceData || [];

    if (typeof props.optionLabel === "string") {
      labels = sourceData.map((d) => d[props.optionLabel]);
    } else if (_.isArray(props.optionLabel)) {
      labels = props.optionLabel;
    }

    if (typeof props.optionValue === "string") {
      values = sourceData.map((d) => d[props.optionValue]);
    } else if (_.isArray(props.optionValue)) {
      values = props.optionValue;
    }

    return sourceData.map((d, i) => ({
      label: labels[i],
      value: values[i],
    }));
  },
  //
  getIsValid: (props, moment, _) => {
    return props.isRequired
      ? !_.isNil(props.selectedOptionValues) &&
          props.selectedOptionValues.length !== 0
      : true;
  },
  //
  getSelectedOptionValues: (props, moment, _) => {
    const options = props.options ?? [];
    const selectedOptions = props.selectedOptions ?? [];

    const values = selectedOptions.map((o) => o.value ?? o);
    const valuesInOptions = options.map((o) => o.value);
    const filteredValues = values.filter((value) =>
      valuesInOptions.includes(value),
    );

    if (!props.isDirty && filteredValues.length !== values.length) {
      return filteredValues;
    }

    return values;
  },
  //
  getSelectedOptionLabels: (props, moment, _) => {
    const values = props.selectedOptionValues;
    const selectedOptions = props.selectedOptions ?? [];

    const options = props.options ?? [];

    return values
      .map((value) => {
        const label = options.find((option) => value === option.value)?.label;

        if (label) {
          return label;
        } else {
          return selectedOptions.find(
            (option) => value === (option.value ?? option),
          )?.label;
        }
      })
      .filter((val) => !_.isNil(val));
  },
  //
};
