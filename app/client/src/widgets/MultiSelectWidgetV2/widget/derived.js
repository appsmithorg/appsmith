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
    let selectedOptions = props.selectedOptions ?? [];

    let values = selectedOptions.map((o) => o.value ?? o);
    const filteredValue = values
      .map((value) => options.find((option) => value === option.value)?.value)
      .filter((val) => !_.isNil(val));

    if (!props.isDirty && filteredValue.length !== values.length) {
      values = filteredValue;
    }

    return values;
  },
  //
  getSelectedOptionLabels: (props, moment, _) => {
    let values = props.selectedOptionValues;
    let selectedOptions = props.selectedOptions ?? [];
    const options = props.options ?? [];

    const hasLabelValue = (obj) => {
      return (
        _.isPlainObject(obj) &&
        obj.hasOwnProperty("label") &&
        obj.hasOwnProperty("value") &&
        _.isString(obj.label) &&
        (_.isString(obj.value) || _.isFinite(obj.value))
      );
    };
    let filteredLabels;
    if (selectedOptions.every(hasLabelValue)) {
      filteredLabels = values
        .map((value) => {
          if (options.find((option) => value === option.value)?.label) {
            return options.find((option) => value === option.value)?.label;
          } else {
            return selectedOptions.find((option) => value === option.value)
              ?.label;
          }
        })
        .filter((val) => !_.isNil(val));
    } else {
      filteredLabels = values
        .map(
          (value) =>
            options.find((option) => value === option.value)?.label ?? value,
        )
        .filter((val) => !_.isNil(val));
    }

    return filteredLabels;
  },
  //
};
