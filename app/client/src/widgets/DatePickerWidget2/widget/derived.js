/* eslint-disable @typescript-eslint/no-unused-vars*/
export default {
  isValidDate: (props, moment, _) => {
    if (props.isRequired) {
      const minDate = new Date(props.minDate);
      const maxDate = new Date(props.maxDate);
      const selectedDate = new Date(props.selectedDate);
      const isValid = moment(selectedDate).isBetween(minDate, maxDate);
      return isValid;
    }
    return true;
  },
  //
};
