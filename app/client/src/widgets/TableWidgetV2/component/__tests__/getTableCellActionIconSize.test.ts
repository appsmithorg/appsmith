import {
  CompactModeTypes,
  TABLE_CELL_ACTION_ICON_SIZE,
  getTableCellActionIconSize,
} from "../Constants";

describe("getTableCellActionIconSize", () => {
  it("returns 24 for SHORT compact mode", () => {
    expect(getTableCellActionIconSize(CompactModeTypes.SHORT)).toBe(24);
  });

  it("returns 28 for DEFAULT and TALL so the control fills the content budget evenly", () => {
    expect(getTableCellActionIconSize(CompactModeTypes.DEFAULT)).toBe(28);
    expect(getTableCellActionIconSize(CompactModeTypes.TALL)).toBe(28);
    expect(getTableCellActionIconSize(undefined)).toBe(28);
  });

  it("keeps DEFAULT/TALL size within the cell content budget", () => {
    const contentBudget = 40 - 6 * 2;

    expect(TABLE_CELL_ACTION_ICON_SIZE.DEFAULT).toBeLessThanOrEqual(
      contentBudget,
    );
  });
});
