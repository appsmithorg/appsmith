/* eslint-disable @typescript-eslint/no-unused-vars*/
export default {
  isValidDate: (props, moment, _) => {
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

    // Get comparison settings based on time precision
    const { granularity, inclusivity } = getDateComparisonSettings(
      props.timePrecision,
    );

    // Check date range constraints
    if (minDate && maxDate) {
      return selectedDate.isBetween(minDate, maxDate, granularity, inclusivity);
    }

    if (minDate) {
      return selectedDate.isAfter(minDate, granularity, inclusivity);
    }

    if (maxDate) {
      return selectedDate.isBefore(maxDate, granularity, inclusivity);
    }

    return true;
  },
  //
};

function getDateComparisonSettings(timePrecision) {
  const settings = {
    granularity: undefined,
    inclusivity: "[]", // Include both bounds by default
  };

  switch (timePrecision) {
    case "None":
      settings.granularity = "day";
      break;
    case "second":
    case "minute":
    case "millisecond":
      settings.granularity = timePrecision;
      break;
  }

  return settings;
}
