import "@testing-library/jest-dom/extend-expect";
import React from "react";
import { render } from "@testing-library/react";

import { ImageInput } from "./ImageInput";

jest.mock("ee/utils/airgapHelpers", () => ({
  getAssetUrl: (url: string) => url,
}));

const fileInput = (container: HTMLElement) =>
  container.querySelector("input[type=file]");

describe("ImageInput", () => {
  it("limits the file picker to the given accept list", () => {
    const { container } = render(<ImageInput accept=".jpeg,.jpg,.png" />);

    expect(fileInput(container)).toHaveAttribute("accept", ".jpeg,.jpg,.png");
  });

  it("accepts any image when no accept list is given", () => {
    const { container } = render(<ImageInput />);

    expect(fileInput(container)).toHaveAttribute("accept", "image/*");
  });
});
