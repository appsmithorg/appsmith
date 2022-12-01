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
    const options = props.flattenedOptions ?? [];
    const values = props.selectedOptionValueArr ?? [];

    const valuesInOptions = options.map((o) => o.value);

    const filteredValues = values.filter((value) =>
      valuesInOptions.includes(value),
    );

    return filteredValues;
  },
  //
  getSelectedOptionLabels: (props, moment, _) => {
    const values = props.selectedOptionValues;

    const options = props.flattenedOptions ?? [];

    return values
      .map((value) => {
        return options.find((option) => value === option.value)?.label;
      })
      .filter((val) => !_.isNil(val));
  },
  //
  getFlattenedOptions: (props, moment, _) => {
    const flat = (array) => {
      let result = [];
      array.forEach((a) => {
        result.push({ value: a.value, label: a.label });
        if (Array.isArray(a.children)) {
          result = result.concat(flat(a.children));
        }
      });
      return result;
    };

    return flat(props.options);
  },
  //
};
