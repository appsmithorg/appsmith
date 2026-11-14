import {
  CompactModeTypes,
  TABLE_CELL_ACTION_ICON_SIZE,
  TABLE_CELL_ACTION_VERTICAL_PADDING,
  getTableCellActionIconSize,
} from "../Constants";

describe("getTableCellActionIconSize", () => {
  it("returns 24 for SHORT compact mode", () => {
    expect(getTableCellActionIconSize(CompactModeTypes.SHORT)).toBe(24);
  });

  it("returns 30 for DEFAULT and TALL", () => {
    expect(getTableCellActionIconSize(CompactModeTypes.DEFAULT)).toBe(30);
    expect(getTableCellActionIconSize(CompactModeTypes.TALL)).toBe(30);
    expect(getTableCellActionIconSize(undefined)).toBe(30);
  });

  it("fits DEFAULT size when action-cell vertical padding is 5px", () => {
    const contentBudget = 40 - TABLE_CELL_ACTION_VERTICAL_PADDING * 2;

    expect(TABLE_CELL_ACTION_VERTICAL_PADDING).toBe(5);
    expect(TABLE_CELL_ACTION_ICON_SIZE.DEFAULT).toBeLessThanOrEqual(
      contentBudget,
    );
  });

  it("is intentionally larger than Button/Menu DEFAULT (30 vs 27)", () => {
    // Icon/Video restored to 30px per APP-16500; Button/Menu stay at 27px.
    expect(TABLE_CELL_ACTION_ICON_SIZE.DEFAULT).toBe(30);
    expect(TABLE_CELL_ACTION_ICON_SIZE.DEFAULT).toBeGreaterThan(27);
  });
});
