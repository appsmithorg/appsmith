export default {
  isValidDate: (props, moment) => {
    // Early return if no date is selected and it's not required
    if (!props.selectedDate && !props.isRequired) {
      return true;
    }

    // Parse dates
    const minDate = props.minDate ? new Date(props.minDate) : null;
    const maxDate = props.maxDate ? new Date(props.maxDate) : null;
    const selectedDate = props.selectedDate
      ? moment(new Date(props.selectedDate))
      : null;

    // Handle no selected date case
    if (!selectedDate) {
      return !props.isRequired;
    }

    // Set comparison settings based on time precision
    let granularity, inclusivity;

    switch (props.timePrecision) {
      case "None":
        granularity = "day";
        inclusivity = "[]";
        break;
      case "second":
      case "minute":
      case "millisecond":
        granularity = props.timePrecision;
        inclusivity = "[]";
        break;
    }

    // Check date range constraints
    if (minDate && maxDate) {
      return selectedDate.isBetween(minDate, maxDate, granularity, inclusivity);
    }

    if (minDate) {
      return selectedDate.isAfter(minDate);
    }

    if (maxDate) {
      return selectedDate.isBefore(maxDate);
    }

    return true;
  },
  //
};
