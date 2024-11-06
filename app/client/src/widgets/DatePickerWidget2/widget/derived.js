/* eslint-disable @typescript-eslint/no-unused-vars*/
export default {
  isValidDate: (props, moment, _) => {
    if (!props.selectedDate && !props.isRequired) {
      return true;
    }

    const minDate = props.minDate ? new Date(props.minDate) : null;
    const maxDate = props.maxDate ? new Date(props.maxDate) : null;
    const selectedDate = props.selectedDate
      ? moment(new Date(props.selectedDate))
      : props.selectedDate;

    if (!selectedDate) {
      return !props.isRequired;
    }

    let granularity,
      inclusivity = "[]";

    switch (props.timePrecision) {
      case "None":
        granularity = "day";
        break;
      case "second":
      case "minute":
      case "millisecond":
        granularity = props.timePrecision;
        break;
      default:
        granularity = undefined;
        inclusivity = undefined;
    }

    if (minDate && maxDate) {
      return selectedDate.isBetween(minDate, maxDate, granularity, inclusivity);
    }

    if (minDate) {
      if (props.timePrecision === "None") {
        return selectedDate.isSameOrAfter(minDate, granularity);
      }

      return selectedDate.isSame(minDate, granularity);
    }

    if (maxDate) {
      if (props.timePrecision === "None") {
        return selectedDate.isSameOrBefore(maxDate, granularity);
      }

      return selectedDate.isBefore(maxDate, granularity);
    }

    return true;
  },
  //
};
