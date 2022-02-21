/* eslint-disable @typescript-eslint/no-unused-vars*/
export default {
  getSelectedTab: (props, moment, _) => {
    if (props.selectedTabWidgetId) {
      return _.find(Object.values(props.tabsObj), {
        widgetId: props.selectedTabWidgetId,
      }).label;
    }

    const isDefaultTabExist = Object.values(props.tabsObj).filter(
      (tab) => tab.label === props.defaultTab,
    ).length;
    if (isDefaultTabExist) {
      return props.defaultTab;
    }
    const tabLabels = Object.values(props.tabsObj);
    return tabLabels.length ? tabLabels[0].label : "";
  },
  //
};
