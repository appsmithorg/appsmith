import { TABLE_VIDEO_PLAY_ICON_SIZE } from "./PopoverVideo";

describe("PopoverVideo play icon size", () => {
  it("fits the table cell DEFAULT/TALL content budget (28px)", () => {
    expect(TABLE_VIDEO_PLAY_ICON_SIZE).toBe(27);
    expect(TABLE_VIDEO_PLAY_ICON_SIZE).toBeLessThanOrEqual(28);
  });
});
