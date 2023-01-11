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
  //
  getTriggeredItem: (props, moment, _) => {
    const triggeredItemIndex =
      props.triggeredItemIndex === undefined ||
      Number.isNaN(parseInt(props.triggeredItemIndex))
        ? -1
        : parseInt(props.triggeredItemIndex);
    const items = props.listData || [];

    if (triggeredItemIndex === -1) {
      const emptyRow = { ...items[0] };
      Object.keys(emptyRow).forEach((key) => {
        emptyRow[key] = "";
      });
      return emptyRow;
    }

    const triggeredItem = { ...items[triggeredItemIndex] };
    return triggeredItem;
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
