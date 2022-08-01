export default {
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
    const filteredValue = values.filter((value) =>
      valuesInOptions.includes(value),
    );

    if (!props.isDirty && filteredValue.length !== values.length) {
      return filteredValue;
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
        if (options.find((option) => value === option.value)?.label) {
          return options.find((option) => value === option.value)?.label;
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
