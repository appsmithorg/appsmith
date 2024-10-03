export default {
  isValid: (props, moment) => {
    const parsedMinDate = new Date(props.minDate);
    const parsedMaxDate = new Date(props.maxDate);
    const parsedSelectedDate = props.selectedDate
      ? moment(new Date(props.selectedDate))
      : null;

    // only do validation when the date is dirty
    if (!props.isDirty) {
      return true;
    }

    if (!parsedSelectedDate && !props.isRequired) {
      return true;
    }

    if (!parsedSelectedDate && props.isRequired) {
      return false;
    }

    if (props.minDate && props.maxDate) {
      return parsedSelectedDate.isBetween(parsedMinDate, parsedMaxDate);
    }

    if (props.minDate) {
      return parsedSelectedDate.isAfter(parsedMinDate);
    }

    if (props.maxDate) {
      return parsedSelectedDate.isBefore(parsedMaxDate);
    }

    return true;
  },
};
