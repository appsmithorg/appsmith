import derivedProperty from "../../derived";

describe("getPageSize -", () => {
  const { getPageSize } = derivedProperty;
  const tableData = [{ id: 1 }, { id: 2 }, { id: 3 }];

  describe("when height is fixed", () => {
    it("derives the page size from the component height for each row height", () => {
      const props = { componentHeight: 280, tableData };

      expect(getPageSize({ ...props, compactMode: "SHORT" })).toEqual(6);
      expect(getPageSize({ ...props, compactMode: "DEFAULT" })).toEqual(5);
      expect(getPageSize({ ...props, compactMode: "TALL" })).toEqual(3);
    });

    it("ignores autoHeightRowCount", () => {
      expect(
        getPageSize({
          componentHeight: 280,
          compactMode: "DEFAULT",
          dynamicHeight: "FIXED",
          autoHeightRowCount: 20,
          tableData,
        }),
      ).toEqual(5);
    });
  });

  describe("when height is auto", () => {
    it.each(["AUTO_HEIGHT", "AUTO_HEIGHT_WITH_LIMITS"])(
      "returns autoHeightRowCount for %s regardless of component height",
      (dynamicHeight) => {
        expect(
          getPageSize({
            componentHeight: 280,
            compactMode: "DEFAULT",
            dynamicHeight,
            autoHeightRowCount: 20,
            tableData,
          }),
        ).toEqual(20);
      },
    );

    it("falls back to 10 rows when autoHeightRowCount is missing or invalid", () => {
      const props = {
        componentHeight: 280,
        dynamicHeight: "AUTO_HEIGHT",
        tableData,
      };

      expect(getPageSize(props)).toEqual(10);
      expect(getPageSize({ ...props, autoHeightRowCount: "abc" })).toEqual(10);
      expect(getPageSize({ ...props, autoHeightRowCount: 0 })).toEqual(10);
      expect(getPageSize({ ...props, autoHeightRowCount: -5 })).toEqual(10);
    });

    it("rounds a fractional autoHeightRowCount down", () => {
      expect(
        getPageSize({
          componentHeight: 280,
          dynamicHeight: "AUTO_HEIGHT",
          autoHeightRowCount: 7.8,
          tableData,
        }),
      ).toEqual(7);
    });

    it("returns autoHeightRowCount even when infinite scroll is enabled", () => {
      expect(
        getPageSize({
          componentHeight: 280,
          compactMode: "DEFAULT",
          dynamicHeight: "AUTO_HEIGHT",
          autoHeightRowCount: 20,
          infiniteScrollEnabled: true,
          tableData,
        }),
      ).toEqual(20);
    });
  });
});
