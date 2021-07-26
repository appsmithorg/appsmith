import derivedProperty from "./derived";
import moment from "moment";
import _ from "lodash";

describe("Validates Derived Properties", () => {
  it("validates selectedItem property", () => {
    const { getSelectedItem } = derivedProperty;
    const input = {
      listData: [{ id: 1 }, { id: 2 }],
      selectedItemIndex: 1,
    };

    const expected = { id: 2 };

    let result = getSelectedItem(input, moment, _);
    expect(result).toStrictEqual(expected);
  });

  it("validates items property", () => {
    const { getItems } = derivedProperty;
    const input = {
      listData: [1, 2],
      template: {
        Input1: {
          widgetName: "Input1",
          widgetId: "some-random-id",
          text: [1, 2],
          dynamicBindingPathList: [{ key: "text" }],
        },
      },
    };

    const expected = [
      {
        Input1: {
          widgetName: "Input1",
          widgetId: "some-random-id",
          dynamicBindingPathList: [{ key: "text" }],
          text: 1,
        },
      },
      {
        Input1: {
          widgetName: "Input1",
          widgetId: "some-random-id",
          dynamicBindingPathList: [{ key: "text" }],
          text: 2,
        },
      },
    ];

    let result = getItems(input, moment, _);
    expect(result).toStrictEqual(expected);
  });
});
