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

    const granularity = ["day", "hour", "minute", "second"].includes(
      props.timePrecision,
    )
      ? props.timePrecision
      : undefined;

    if (props.minDate && props.maxDate) {
      return parsedSelectedDate.isBetween(
        parsedMinDate,
        parsedMaxDate,
        granularity,
        "[]",
      );
    }

    if (props.minDate) {
      return parsedSelectedDate.isSameOrAfter(parsedMinDate, granularity);
    }

    if (props.maxDate) {
      return parsedSelectedDate.isSameOrBefore(parsedMaxDate, granularity);
    }

    return true;
  },
};
