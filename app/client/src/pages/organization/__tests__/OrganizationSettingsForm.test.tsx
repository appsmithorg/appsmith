import React from "react";
import { unmountComponentAtNode } from "react-dom";
import { render } from "test/testUtils";
import "@testing-library/jest-dom";
import { GeneralSettings } from "../General";

let container: any = null;
describe("Application Settings", () => {
  beforeEach(async () => {
    // setup a DOM element as a render target
    container = document.createElement("div");
    document.body.appendChild(container);
  });
  it("checks that organization settings have correct styling", async (done) => {
    const { findByText } = render(<GeneralSettings />);

    const orgNameField = await findByText("Organization Name");
    expect(orgNameField.closest("div")).toHaveStyle({ width: "150px;" });

    await done();
  });
  afterEach(() => {
    // cleanup on exiting
    unmountComponentAtNode(container);
    container.remove();
    container = null;
  });
});
