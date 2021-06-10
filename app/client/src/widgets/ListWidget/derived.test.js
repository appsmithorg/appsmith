import derivedProperty from "./derived";
import moment from "moment";
import _ from "lodash";

describe("Validates Derived Properties", () => {
  it("validates items properties", () => {
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
