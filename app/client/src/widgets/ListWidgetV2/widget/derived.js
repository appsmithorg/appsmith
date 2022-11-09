/* eslint-disable @typescript-eslint/no-unused-vars*/
export default {
  getSelectedItem: (props, moment, _) => {
    const selectedRowIndex =
      props.selectedRowIndex === undefined ||
      Number.isNaN(parseInt(props.selectedRowIndex))
        ? -1
        : parseInt(props.selectedRowIndex);
    const items = props.listData || [];

    if (selectedRowIndex === -1) {
      const emptyRow = { ...items[0] };
      Object.keys(emptyRow).forEach((key) => {
        emptyRow[key] = "";
      });
      return emptyRow;
    }

    const selectedItem = { ...items[selectedRowIndex] };
    return selectedItem;
  },
  //
  getSelectedRow: (props, moment, _) => {
    const selectedRowViewIndex =
      props.selectedRowViewIndex === undefined ||
      Number.isNaN(parseInt(props.selectedRowViewIndex))
        ? -1
        : parseInt(props.selectedRowViewIndex);
    const rows = props.currentViewRows || [];

    if (selectedRowViewIndex === -1) {
      const emptyRow = { ...rows[0] };
      Object.keys(emptyRow).forEach((key) => {
        emptyRow[key] = "";
      });
      return emptyRow;
    }

    const currentSelectedRow = { ...rows[selectedRowViewIndex] };
    return currentSelectedRow;
  },
  // this is just a patch for #7520
  getChildAutoComplete: (props, moment, _) => {
    const data = [...props.listData];

    const structure =
      Array.isArray(data) && data.length > 0
        ? Object.assign(
            {},
            ...Object.keys(data[0]).map((key) => ({
              [key]: "",
            })),
          )
        : {};
    return { currentItem: structure, currentIndex: "" };
  },
  //
};
