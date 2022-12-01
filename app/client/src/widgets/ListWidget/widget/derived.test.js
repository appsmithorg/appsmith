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
      childrenEntityDefinitions: {
        TEXT_WIDGET: ["text"],
      },
      template: {
        Input1: {
          widgetName: "Input1",
          widgetId: "some-random-id",
          text: [1, 2],
          type: "TEXT_WIDGET",
          dynamicBindingPathList: [{ key: "text" }],
        },
      },
    };

    const expected = [
      {
        Input1: {
          text: 1,
        },
      },
      {
        Input1: {
          text: 2,
        },
      },
    ];

    let result = getItems(input, moment, _);
    expect(result).toStrictEqual(expected);
  });

  it("validates pageSize property", () => {
    const { getPageSize } = derivedProperty;
    const DEFAULT_LIST_ITEM_HEIGHT = 16;
    const DEFAULT_LIST_HEIGHT = 86;
    const input1 = {
      bottomRow: DEFAULT_LIST_HEIGHT,
      templateBottomRow: DEFAULT_LIST_ITEM_HEIGHT,
      gridGap: 0,
      parentRowSpace: 10,
      topRow: 9,
      listData: [{}, {}],
    };
    // decrease ListWidget height (bottomRow changes)
    const input2 = {
      ...input1,
      bottomRow: 56,
    };

    // increase ListWidget height (bottomRow changes)
    const input3 = {
      ...input1,
      bottomRow: 340,
    };

    // increase ListItem height (templateBottomRow changes)
    const input4 = {
      ...input1,
      templateBottomRow: DEFAULT_LIST_ITEM_HEIGHT * 2,
      bottomRow: 340,
    };

    // undefined listData
    const input5 = {
      ...input1,
      listData: undefined,
    };

    // empty listData
    const input6 = {
      ...input1,
      listData: [],
    };

    // server side pagination enabled
    const input7 = {
      ...input1,
      listData: [],
      serverSidePaginationEnabled: true,
    };

    const expected1 = 4;
    const expected2 = 2;
    const expected3 = 20;
    const expected4 = 10;
    const expected5 = 4;
    const expected6 = 4;
    const expected7 = 4;

    const result1 = getPageSize(input1, moment, _);
    const result2 = getPageSize(input2, moment, _);
    const result3 = getPageSize(input3, moment, _);
    const result4 = getPageSize(input4, moment, _);
    const result5 = getPageSize(input5, moment, _);
    const result6 = getPageSize(input6, moment, _);
    const result7 = getPageSize(input7, moment, _);

    expect(result1).toStrictEqual(expected1);
    expect(result2).toStrictEqual(expected2);
    expect(result3).toStrictEqual(expected3);
    expect(result4).toStrictEqual(expected4);
    expect(result5).toStrictEqual(expected5);
    expect(result6).toStrictEqual(expected6);
    expect(result7).toStrictEqual(expected7);
  });
});
