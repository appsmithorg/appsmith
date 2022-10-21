/* eslint-disable @typescript-eslint/no-unused-vars*/
export default {
  getSelectedItem: (props, moment, _) => {
    const selectedItemIndex =
      props.selectedItemIndex === undefined ||
      Number.isNaN(parseInt(props.selectedItemIndex))
        ? -1
        : parseInt(props.selectedItemIndex);
    const items = props.listData || [];

    if (selectedItemIndex === -1) {
      const emptyRow = { ...items[0] };
      Object.keys(emptyRow).forEach((key) => {
        emptyRow[key] = "";
      });
      return emptyRow;
    }

    const selectedItem = { ...items[selectedItemIndex] };
    return selectedItem;
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
