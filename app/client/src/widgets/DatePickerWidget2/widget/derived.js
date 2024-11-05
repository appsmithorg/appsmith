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
      if (!selectedDate) {
        dateValid = !props.isRequired;
      } else {
        let granularityToCheck = undefined;
        let inclusivityMarkers = undefined;

        switch (props.timePrecision) {
          case "None":
            granularityToCheck = "day";
            inclusivityMarkers = "[]";
            break;
          case "second":
          case "minute":
          case "millisecond":
            granularityToCheck = props.timePrecision;
            inclusivityMarkers = "[]";
            break;
        }
        dateValid = selectedDate.isBetween(
          minDate,
          maxDate,
          granularityToCheck,
          inclusivityMarkers,
        );
      }
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
