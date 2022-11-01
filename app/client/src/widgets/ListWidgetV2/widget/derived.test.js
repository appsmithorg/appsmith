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
});
