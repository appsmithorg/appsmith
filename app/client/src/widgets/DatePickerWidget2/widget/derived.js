/* eslint-disable @typescript-eslint/no-unused-vars*/
export default {
  isValidDate: (props, moment, _) => {
    const minDate = new Date(props.minDate);
    const maxDate = new Date(props.maxDate);
    const selectedDate =
      props.selectedDate !== ""
        ? moment(new Date(props.selectedDate))
        : props.selectedDate;
    return !!selectedDate
      ? selectedDate.isBetween(minDate, maxDate)
      : !props.isRequired;
  },
  //
};
