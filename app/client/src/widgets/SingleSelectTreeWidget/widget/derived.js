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
    let label = props.selectedLabel;
    const labelIndex = _.findIndex(
      options,
      (option) =>
        option.label === label && option.value === props.selectedOptionValue,
    );
    if (labelIndex === -1) {
      if (
        !_.isNil(props.selectedOptionValue) &&
        props.selectedOptionValue !== ""
      ) {
        const selectedOption = _.find(
          options,
          (option) => option.value === props.selectedOptionValue,
        );
        if (selectedOption) {
          label = selectedOption.label;
        }
      } else {
        label = "";
      }
    }

    return label;
  },
  //
};
