import { TABLE_VIDEO_PLAY_ICON_SIZE } from "./PopoverVideo";

describe("PopoverVideo play icon size", () => {
  it("uses 28px to fill the table cell content budget evenly", () => {
    expect(TABLE_VIDEO_PLAY_ICON_SIZE).toBe(28);
  });
});
