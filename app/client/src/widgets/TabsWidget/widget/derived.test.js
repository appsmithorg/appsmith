import derivedProperty from "./derived";
import moment from "moment";
import _ from "lodash";
describe("Validates Derived Properties", () => {
  it("validates with selectedTabWidgetId", () => {
    const { getSelectedTab } = derivedProperty;
    const input = {
      selectedTabWidgetId: "wy2ehwc35r",
      tabsObj: {
        tab1: {
          label: "Tab 1",
          id: "tab1",
          widgetId: "wy2ehwc35r",
          isVisible: true,
          index: 0,
        },
        tab2: {
          label: "Tab 2",
          id: "tab2",
          widgetId: "4pity919kx",
          isVisible: true,
          index: 1,
        },
      },
      defaultTab: "Tab 2",
    };
    const expected = "Tab 1";

    let result = getSelectedTab(input, moment, _);
    expect(result).toStrictEqual(expected);
  });
  it("validates without selectedTabWidgetId", () => {
    const { getSelectedTab } = derivedProperty;
    const input = {
      selectedTabWidgetId: "",
      tabsObj: {
        tab1: {
          label: "Tab 1",
          id: "tab1",
          widgetId: "wy2ehwc35r",
          isVisible: true,
          index: 0,
        },
        tab2: {
          label: "Tab 2",
          id: "tab2",
          widgetId: "4pity919kx",
          isVisible: true,
          index: 1,
        },
      },
      defaultTab: "Tab 2",
    };
    const expected = "Tab 2";

    let result = getSelectedTab(input, moment, _);
    expect(result).toStrictEqual(expected);
  });
  it("validates without selectedTabWidgetId and defaultTab", () => {
    const { getSelectedTab } = derivedProperty;
    const input = {
      selectedTabWidgetId: "",
      tabsObj: {
        tab1: {
          label: "Tab 1",
          id: "tab1",
          widgetId: "wy2ehwc35r",
          isVisible: true,
          index: 0,
        },
        tab2: {
          label: "Tab 2",
          id: "tab2",
          widgetId: "4pity919kx",
          isVisible: true,
          index: 1,
        },
      },
      defaultTab: "",
    };
    const expected = "Tab 1";

    let result = getSelectedTab(input, moment, _);
    expect(result).toStrictEqual(expected);
  });
  it("validates without selectedTabWidgetId and with defaultTab but not in tabs", () => {
    const { getSelectedTab } = derivedProperty;
    const input = {
      selectedTabWidgetId: "",
      tabsObj: {
        tab1: {
          label: "Tab 1",
          id: "tab1",
          widgetId: "wy2ehwc35r",
          isVisible: true,
          index: 0,
        },
        tab2: {
          label: "Tab 2",
          id: "tab2",
          widgetId: "4pity919kx",
          isVisible: true,
          index: 1,
        },
      },
      defaultTab: "Tab 3",
    };
    const expected = "Tab 1";

    let result = getSelectedTab(input, moment, _);
    expect(result).toStrictEqual(expected);
  });
});
