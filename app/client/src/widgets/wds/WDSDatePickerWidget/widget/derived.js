export default {
  isValid: (props, moment) => {
    // Only validate when the date is dirty.
    if (!props.isDirty) {
      return true;
    }

    const parsedSelectedDate = props.selectedDate
      ? moment(props.selectedDate)
      : null;

    if (!parsedSelectedDate && !props.isRequired) {
      return true;
    }

    if (!parsedSelectedDate && props.isRequired) {
      return false;
    }

    // Parse all dates consistently using Moment.
    const parsedMinDate = props.minDate ? moment(props.minDate) : null;
    const parsedMaxDate = props.maxDate ? moment(props.maxDate) : null;

    // Respect the configured DatePicker precision.
    const precision = props.timePrecision || "day";

    // Include the minimum date in the valid range.
    if (
      parsedMinDate &&
      !parsedSelectedDate.isSameOrAfter(parsedMinDate, precision)
    ) {
      return false;
    }

    // Include the maximum date in the valid range.
    if (
      parsedMaxDate &&
      !parsedSelectedDate.isSameOrBefore(parsedMaxDate, precision)
    ) {
      return false;
    }

    return true;
  },
};
