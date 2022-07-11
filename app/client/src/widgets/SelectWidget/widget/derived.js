/* eslint-disable @typescript-eslint/no-unused-vars*/
export default {
  getIsValid: (props, moment, _) => {
    return props.isRequired
      ? !_.isNil(props.selectedOptionValue) &&
          !_.isEmpty(props.selectedOptionValue)
      : true;
  },
  //
  getSelectedOptionValue: (props, moment, _) => {
    const isServerSideFiltered = props.serverSideFiltering;
    const options = props.options ?? [];
    let value = _.isPlainObject(props.value) ? props.value?.value : props.value;

    if (!isServerSideFiltered) {
      const valueIndex = _.findIndex(
        options,
        (option) => option.value === value,
      );
      if (valueIndex === -1) {
        value = "";
      }
    }
    return value;
  },
  //
  getSelectedOptionLabel: (props, moment, _) => {
    const isServerSideFiltered = props.serverSideFiltering;
    const options = props.options ?? [];
    let label = _.isPlainObject(props.label) ? props.label?.label : props.label;
    const labelIndex = _.findIndex(options, (option) => option.label === label);
    if (labelIndex === -1) {
      if (
        !_.isNil(props.selectedOptionValue) &&
        !_.isEmpty(props.selectedOptionValue)
      ) {
        const selectedOption = _.find(
          options,
          (option) => option.value === props.selectedOptionValue,
        );
        if (selectedOption) {
          label = selectedOption.label;
        }
      } else {
        if (!isServerSideFiltered) {
          label = "";
        }
      }
    }

    return label;
  },
  //
};
