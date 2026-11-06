import {
  CompactModeTypes,
  TABLE_CELL_ACTION_ICON_SIZE,
  getTableCellActionIconSize,
} from "../Constants";

describe("getTableCellActionIconSize", () => {
  it("returns 24 for SHORT compact mode so the control fits the 30px row", () => {
    expect(getTableCellActionIconSize(CompactModeTypes.SHORT)).toBe(
      TABLE_CELL_ACTION_ICON_SIZE.SHORT,
    );
    expect(getTableCellActionIconSize(CompactModeTypes.SHORT)).toBe(24);
  });

  it("returns 27 for DEFAULT and TALL so the control fits the 28px content budget", () => {
    expect(getTableCellActionIconSize(CompactModeTypes.DEFAULT)).toBe(
      TABLE_CELL_ACTION_ICON_SIZE.DEFAULT,
    );
    expect(getTableCellActionIconSize(CompactModeTypes.TALL)).toBe(
      TABLE_CELL_ACTION_ICON_SIZE.DEFAULT,
    );
    expect(getTableCellActionIconSize(CompactModeTypes.DEFAULT)).toBe(27);
    expect(getTableCellActionIconSize(undefined)).toBe(27);
  });

  it("keeps DEFAULT/TALL size within the cell content budget", () => {
    const contentBudget =
      // ROW_HEIGHT − VERTICAL_PADDING × 2 for DEFAULT/TALL
      40 - 6 * 2;

    expect(TABLE_CELL_ACTION_ICON_SIZE.DEFAULT).toBeLessThanOrEqual(
      contentBudget,
    );
  });

  it("matches the Button column DEFAULT min-height (27px)", () => {
    expect(TABLE_CELL_ACTION_ICON_SIZE.DEFAULT).toBe(27);
  });
});
