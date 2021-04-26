import { canDrag } from "./DraggableComponent";

describe("DraggableComponent", () => {
  it("it tests draggable canDrag helper function", () => {
    expect(canDrag(false, false, { dragDisabled: false })).toBe(true);
    expect(canDrag(true, false, { dragDisabled: false })).toBe(false);
    expect(canDrag(false, true, { dragDisabled: false })).toBe(false);
    expect(canDrag(false, false, { dragDisabled: true })).toBe(false);
  });
});
