import "@testing-library/jest-dom";
import React from "react";
import { render } from "@testing-library/react";
import { ViewerEditionExtensions } from "./ViewerEditionExtensions";

describe("ViewerEditionExtensions (community edition)", () => {
  it("renders nothing", () => {
    const { container } = render(<ViewerEditionExtensions />);

    expect(container).toBeEmptyDOMElement();
  });
});
