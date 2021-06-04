/* eslint-disable @typescript-eslint/no-unused-vars*/
export default {
  isValid: (props, moment, _) => {
    const isValid = props.isRequired
      ? props.selectionType === "SINGLE_SELECT"
        ? !!props.selectedOption
        : !!props.selectedIndexArr && props.selectedIndexArr.length > 0
      : true;
    return isValid;
  },
  //
  getSelectedOption: (props, moment, _) => {
    if (props.selectionType === "SINGLE_SELECT") {
      const selectedOptionValue =
        props.selectedOptionValue !== undefined
          ? props.selectedOptionValue
          : props.defaultOptionValue;
      return _.find(props.options, { value: selectedOptionValue });
    }
    return undefined;
  },
  //
  getSelectedOptionArr: (props, moment, _) => {
    if (props.selectionType === "MULTI_SELECT") {
      const selectedOptionValues =
        props.selectedOptionValueArr !== undefined
          ? props.selectedOptionValueArr
          : props.defaultOptionValue;
      return props.options.filter((opt) =>
        _.includes(selectedOptionValues, opt.value),
      );
    }
    return undefined;
  },
  //
  getSelectedIndex: (props, moment, _) => {
    if (props.selectionType === "SINGLE_SELECT") {
      const selectedOptionValue =
        props.selectedOptionValue !== undefined
          ? props.selectedOptionValue
          : props.defaultOptionValue;
      return _.findIndex(props.options, { value: selectedOptionValue });
    }
    return -1;
  },
  //
  getSelectedIndexArr: (props, moment, _) => {
    const selectedOptions =
      props.selectedOptionValueArr !== undefined
        ? props.selectedOptionValueArr
        : props.defaultOptionValue;
    if (Array.isArray(selectedOptions)) {
      return selectedOptions
        .map((o) => _.findIndex(props.options, { value: o }))
        .filter((index) => {
          return index > -1;
        });
    }
    return [];
  },
  //
  getSelectedValue: (props, moment, _) => {
    if (props.selectionType === "MULTI_SELECT") {
      return props.selectedOptionValueArr !== undefined
        ? props.selectedOptionValueArr
        : props.defaultOptionValue;
    } else {
      return props.selectedOptionValue !== undefined
        ? props.selectedOptionValue
        : props.defaultOptionValue;
    }
  },
  //
  getSelectedOptionValues: (props, moment, _) => {
    if (props.selectionType === "MULTI_SELECT") {
      return props.selectedOptionValueArr !== undefined
        ? props.selectedOptionValueArr
        : props.defaultOptionValue;
    }
    return [];
  },
  //
  getSelectedOptionLabels: (props, moment, _) => {
    if (props.selectionType === "MULTI_SELECT") {
      const selectedOptionValues =
        props.selectedOptionValueArr !== undefined
          ? props.selectedOptionValueArr
          : props.defaultOptionValue;
      return selectedOptionValues.map((o) => {
        const index = _.findIndex(props.options, { value: o });
        return props.options[index]?.label;
      });
    }
    return [];
  },
  //
  getSelectedOptionLabel: (props, moment, _) => {
    if (props.selectionType === "SINGLE_SELECT") {
      const selectedOptionValue =
        props.selectedOptionValue !== undefined
          ? props.selectedOptionValue
          : props.defaultOptionValue;
      const index = _.findIndex(props.options, { value: selectedOptionValue });
      return index !== -1 ? props.options[index]?.label : "";
    }
    return "";
  },
  //
};
