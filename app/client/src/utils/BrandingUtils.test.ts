import type React from "react";
import { toast } from "@appsmith/ads";

import { logoImageValidator } from "./BrandingUtils";

jest.mock("@appsmith/ads", () => ({
  ...jest.requireActual("@appsmith/ads"),
  toast: { show: jest.fn() },
}));

const showMock = toast.show as jest.Mock;

const changeEventFor = (file: File) =>
  ({
    target: { files: [file] },
  }) as unknown as React.ChangeEvent<HTMLInputElement>;

describe("logoImageValidator", () => {
  beforeEach(() => {
    showMock.mockClear();
  });

  it("rejects an SVG logo with a format error that does not list SVG", () => {
    const svg = new File(["<svg></svg>"], "logo.svg", {
      type: "image/svg+xml",
    });
    const callback = jest.fn();

    const result = logoImageValidator(changeEventFor(svg), callback);

    expect(result).toBe(false);
    expect(callback).not.toHaveBeenCalled();
    expect(showMock).toHaveBeenCalledTimes(1);

    const [message, options] = showMock.mock.calls[0];

    expect(options).toEqual({ kind: "error" });
    expect(message).toContain(".PNG");
    expect(message).toContain(".JPG");
    expect(message).not.toMatch(/svg/i);
  });
});
