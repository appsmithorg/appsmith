/* eslint-disable @typescript-eslint/no-unused-vars*/
export default {
  getIsValid: (props, moment, _) => {
    return props.isRequired
      ? !_.isNil(props.selectedOptionValue) && props.selectedOptionValue !== ""
      : true;
  },
  //
  getSelectedOptionValue: (props, moment, _) => {
    const isServerSideFiltered = props.serverSideFiltering;
    const options = props.options ?? [];
    let value = props.value?.value ?? props.value;

    const valueIndex = _.findIndex(options, (option) => option.value === value);
    if (valueIndex === -1) {
      if (!isServerSideFiltered) {
        value = "";
      }
      if (
        isServerSideFiltered &&
        !_.isPlainObject(props.value) &&
        !props.isDirty
      ) {
        value = "";
      }
    }

    return value;
  },
  //
  getSelectedOptionLabel: (props, moment, _) => {
    const isServerSideFiltered = props.serverSideFiltering;
    const options = props.options ?? [];
    let label = props.label?.label ?? props.label;
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
        if (
          !isServerSideFiltered ||
          (isServerSideFiltered && props.selectedOptionValue === "")
        ) {
          label = "";
        }
      }
    }

    return label;
  },
  //
};
