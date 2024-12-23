/* eslint-disable @typescript-eslint/no-unused-vars*/
export default {
  getOptions: (props, moment, _) => {
    let labels = [],
      values = [],
      sourceData = props.sourceData || [];

    const processOptionArray = (optionArray, sourceData) => {
      if (!sourceData.length) return [];

      const allEqual = optionArray.every((item, _, arr) => item === arr[0]);
      const keyExistsInSource = optionArray[0] in sourceData[0];

      return allEqual && keyExistsInSource
        ? sourceData.map((d) => d[optionArray[0]])
        : optionArray;
    };

    /**
     * SourceData:
     *  [{
     *    "name": "Blue",
     *    "code": "name"
     *  },{
     *    "name": "Green",
     *    "code": "name"
     *  },{
     *    "name": "Red",
     *    "code": "name"
     *  }]
     * The `Label key` in UI can take following values:
     * 1. Normal string, without any quotes. e.g `name`
     *    This can be assumed as a key in each item of sourceData. We search it in each item of sourceData.
     * 2. Except this everything comes in `{{}}`. It can have 2 types of values:
     *    a. Expressions that evaluate to a normal string. e.g `{{(() => `name`)()}}`
     *        In this case evaluated value will be ['name', 'name', 'name'].
     *        i. This can be assumed as a key in each item of sourceData. Handled by `allLabelsEqual` check.
     *    b. Dynamic property accessed via `item` object. e.g `{{item.name}}`
     *        In this case evaluated value will be actual values form sourceData ['Red', 'Green', 'Blue'].
     *        Hence we can assume that this array is the labels array.
     * */
    if (typeof props.optionLabel === "string") {
      labels = sourceData.map((d) => d[props.optionLabel]);
    } else if (_.isArray(props.optionLabel)) {
      labels = processOptionArray(props.optionLabel, sourceData);
    }

    if (typeof props.optionValue === "string") {
      values = sourceData.map((d) => d[props.optionValue]);
    } else if (_.isArray(props.optionValue)) {
      values = processOptionArray(props.optionValue, sourceData);
    }

    return sourceData.map((d, i) => ({
      label: labels[i],
      value: values[i],
    }));
  },
  //
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
