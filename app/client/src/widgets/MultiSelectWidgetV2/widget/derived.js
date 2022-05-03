/* eslint-disable @typescript-eslint/no-unused-vars*/
export default {
  selectedOptionLabels: (props, moment, _) => {
    if (props.serverSideFiltering) {
      return props.selectedOptions.map((o) => o.label ?? o);
    }
    return props.selectedOptionValues
      .filter((value) => _.find(props.options, { value }))
      .map((o) => o.label ?? o);
  },
  //
  selectedOptionValues: (props, moment, _) => {
    if (props.serverSideFiltering) {
      return props.selectedOptions.map((o) => o.value ?? o);
    }
    return props.selectedOptions
      ?.filter((selectedOption) =>
        props.options?.some(
          (option) => option.value === (selectedOption.value ?? selectedOption),
        ),
      )
      .map((o) => o.value ?? o);
  },
  //
};
