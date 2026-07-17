import _ from "lodash";
import moment from "moment";
import derivedProperty from "../../derived";

describe("getPageSize -", () => {
  test.each([
    ["default", { componentHeight: 280 }, 4],
    ["short", { compactMode: "SHORT", componentHeight: 260 }, 5],
    ["tall", { compactMode: "TALL", componentHeight: 260 }, 2],
  ])(
    "should only count complete %s rows",
    (_rowHeight, props, expectedPageSize) => {
      const { getPageSize } = derivedProperty;

      expect(getPageSize(props, moment, _)).toEqual(expectedPageSize);
    },
  );
});
