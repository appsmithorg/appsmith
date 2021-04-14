import Widget from "./widget";
import IconSVG from "./icon.svg";

export const CONFIG = {
  type: Widget.getWidgetType(),
  name: "Table",
  iconSVG: IconSVG,
  defaults: {
    rows: 7,
    columns: 8,
    label: "Data",
    widgetName: "Table",
    searchKey: "",
    textSize: "PARAGRAPH",
    horizontalAlignment: "LEFT",
    verticalAlignment: "CENTER",
    primaryColumns: {},
    derivedColumns: {},
    tableData: [
      {
        id: 2381224,
        email: "michael.lawson@reqres.in",
        userName: "Michael Lawson",
        productName: "Chicken Sandwich",
        orderAmount: 4.99,
      },
      {
        id: 2736212,
        email: "lindsay.ferguson@reqres.in",
        userName: "Lindsay Ferguson",
        productName: "Tuna Salad",
        orderAmount: 9.99,
      },
      {
        id: 6788734,
        email: "tobias.funke@reqres.in",
        userName: "Tobias Funke",
        productName: "Beef steak",
        orderAmount: 19.99,
      },
    ],
    version: 1,
  },
  properties: {
    validations: Widget.getPropertyValidationMap(),
    derived: Widget.getDerivedPropertiesMap(),
    default: Widget.getDefaultPropertiesMap(),
    meta: Widget.getMetaPropertiesMap(),
    config: Widget.getPropertyPaneConfig(),
  },
};

export default Widget;
