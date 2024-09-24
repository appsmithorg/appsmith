import React from "react";
import { unmountComponentAtNode } from "react-dom";
import { render } from "test/testUtils";
import "@testing-library/jest-dom";
import { GeneralSettings } from "../General";

// TODO: Fix this the next time the file is edited
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let container: any = null;

describe("Application Settings", () => {
  beforeEach(async () => {
    // setup a DOM element as a render target
    container = document.createElement("div");
    document.body.appendChild(container);
  });
  it("checks that workspace settings have correct styling", async () => {
    const { findByText } = render(<GeneralSettings />);

    const workspaceNameField = await findByText("Workspace name");

    expect(workspaceNameField.closest("div")).toHaveStyle({ width: "100%" });
  });
  afterEach(() => {
    // cleanup on exiting
    unmountComponentAtNode(container);
    container.remove();
    container = null;
  });
});
