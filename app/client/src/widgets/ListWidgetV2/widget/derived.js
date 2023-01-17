/* eslint-disable @typescript-eslint/no-unused-vars*/
export default {
  getSelectedItem: (props, moment, _) => {
    const selectedItemIndex = Number.isNaN(parseInt(props.selectedItemIndex))
      ? -1
      : parseInt(props.selectedItemIndex);
    const items = props.listData || [];

    if (selectedItemIndex === -1 || items.length < selectedItemIndex) {
      return undefined;
    }
    return items[selectedItemIndex];
  },
  //
  getTriggeredItem: (props, moment, _) => {
    const triggeredItemIndex = Number.isNaN(parseInt(props.triggeredItemIndex))
      ? -1
      : parseInt(props.triggeredItemIndex);
    const items = props.listData || [];

    if (triggeredItemIndex === -1 || items.length < triggeredItemIndex) {
      return undefined;
    }
    return items[triggeredItemIndex];
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
