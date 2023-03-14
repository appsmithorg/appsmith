import { ReflowDirection } from "reflow/reflowTypes";
import { isHandleResizeAllowed } from "./ResizableUtils";

describe("Resizable Utils", () => {
  it("Handle resize is allowed if directions are not provided", () => {
    const input = {
      horizontalEnabled: false,
      verticalEnabled: false,
    };
    const result = isHandleResizeAllowed(
      input.horizontalEnabled,
      input.verticalEnabled,
    );

    expect(result).toBe(true);
  });

  it("Handle resize is allowed if directions provided are not vertical or horizontal", () => {
    const input = {
      horizontalEnabled: false,
      verticalEnabled: false,
      direction: ReflowDirection.BOTTOMLEFT,
    };
    const result = isHandleResizeAllowed(
      input.horizontalEnabled,
      input.verticalEnabled,
      input.direction,
    );

    expect(result).toBe(true);
  });

  it("Handle resize is allowed if horizontal resize is enabled and directs are left and right", () => {
    const input = [
      {
        horizontalEnabled: true,
        verticalEnabled: false,
        direction: ReflowDirection.LEFT,
      },
      {
        horizontalEnabled: true,
        verticalEnabled: false,
        direction: ReflowDirection.RIGHT,
      },
    ];
    input.forEach((_input) => {
      const result = isHandleResizeAllowed(
        _input.horizontalEnabled,
        _input.verticalEnabled,
        _input.direction,
      );

      expect(result).toBe(true);
    });
  });
  it("Handle resize is disallowed if horizontal resize is disabled and directs are left and right", () => {
    const input = [
      {
        horizontalEnabled: false,
        verticalEnabled: false,
        direction: ReflowDirection.LEFT,
      },
      {
        horizontalEnabled: false,
        verticalEnabled: false,
        direction: ReflowDirection.RIGHT,
      },
    ];
    input.forEach((_input) => {
      const result = isHandleResizeAllowed(
        _input.horizontalEnabled,
        _input.verticalEnabled,
        _input.direction,
      );

      expect(result).toBe(false);
    });
  });
  it("Handle resize is allowed if vertical resize is enabled and directs are top and bottom", () => {
    const input = [
      {
        horizontalEnabled: true,
        verticalEnabled: true,
        direction: ReflowDirection.TOP,
      },
      {
        horizontalEnabled: true,
        verticalEnabled: true,
        direction: ReflowDirection.BOTTOM,
      },
    ];
    input.forEach((_input) => {
      const result = isHandleResizeAllowed(
        _input.horizontalEnabled,
        _input.verticalEnabled,
        _input.direction,
      );

      expect(result).toBe(true);
    });
  });
  it("Handle resize is disallowed if vertical resize is disabled and directs are top and bottom", () => {
    const input = [
      {
        horizontalEnabled: false,
        verticalEnabled: false,
        direction: ReflowDirection.TOP,
      },
      {
        horizontalEnabled: false,
        verticalEnabled: false,
        direction: ReflowDirection.BOTTOM,
      },
    ];
    input.forEach((_input) => {
      const result = isHandleResizeAllowed(
        _input.horizontalEnabled,
        _input.verticalEnabled,
        _input.direction,
      );

      expect(result).toBe(false);
    });
  });
});
