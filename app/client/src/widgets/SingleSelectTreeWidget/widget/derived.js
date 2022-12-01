/* eslint-disable @typescript-eslint/no-unused-vars*/
export default {
  getIsValid: (props, moment, _) => {
    return props.isRequired
      ? !_.isNil(props.selectedOptionValue) && props.selectedOptionValue !== ""
      : true;
  },
  //
  getSelectedOptionValue: (props, moment, _) => {
    const options = props.flattenedOptions ?? [];
    let value = props.selectedOption;

    const valueIndex = _.findIndex(options, (option) => option.value === value);
    if (valueIndex === -1) {
      value = "";
    }

    return value;
  },
  //
  getSelectedOptionLabel: (props, moment, _) => {
    const options = props.flattenedOptions ?? [];
    const label =
      _.find(options, (option) => option.value === props.selectedOptionValue)
        ?.label ?? "";

    return label;
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
