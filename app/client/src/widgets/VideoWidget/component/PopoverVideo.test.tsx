import { TABLE_VIDEO_PLAY_ICON_SIZE } from "./PopoverVideo";

describe("PopoverVideo play icon size", () => {
  it("uses 30px to match the restored Icon Button size", () => {
    expect(TABLE_VIDEO_PLAY_ICON_SIZE).toBe(30);
  });
});
