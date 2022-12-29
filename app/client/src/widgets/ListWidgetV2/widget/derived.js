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
  getChildAutoComplete: (props, moment, _) => {
    const currentItem = props.listData?.[0] ?? {};
    const currentView = props.currentItemsView?.[0];

    const autocomplete = { currentItem, currentIndex: 0, currentView };

    if (props.levelData) {
      const levels = Object.keys(props.levelData);

      levels.forEach((level) => {
        autocomplete[level] = {
          currentIndex: 0,
          currentItem: props.levelData[level].autocomplete.currentItem,
          currentView: props.levelData[level].autocomplete.currentView,
        };
      });
    }

    return autocomplete;
  },
  //
};
