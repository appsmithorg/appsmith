/* eslint-disable @typescript-eslint/no-unused-vars*/
export default {
  isValidDate: (props, moment, _) => {
    const minDate = new Date(props.minDate);
    const maxDate = new Date(props.maxDate);
    const selectedDate =
      props.selectedDate !== ""
        ? moment(new Date(props.selectedDate))
        : props.selectedDate;
    let dateValid = true;
    if (!!props.minDate && !!props.maxDate) {
      dateValid = !!selectedDate
        ? selectedDate.isBetween(minDate, maxDate)
        : !props.isRequired;
    } else if (!!props.minDate) {
      dateValid = !!selectedDate
        ? selectedDate.isAfter(minDate)
        : !props.isRequired;
    } else if (!!props.maxDate) {
      dateValid = !!selectedDate
        ? selectedDate.isBefore(maxDate)
        : !props.isRequired;
    } else {
      dateValid = props.isRequired ? !!selectedDate : true;
    }
    return dateValid;
  },
  //
};
