/* eslint-disable @typescript-eslint/no-unused-vars*/
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
