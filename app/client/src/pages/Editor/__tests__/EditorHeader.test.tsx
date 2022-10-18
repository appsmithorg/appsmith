import React from "react";
import { unmountComponentAtNode } from "react-dom";
import { render, fireEvent } from "test/testUtils";
import "@testing-library/jest-dom";
import { act } from "react-dom/test-utils";
import AppHeader from "../EditorHeader";

let container: any = null;
describe("Editor header", () => {
  beforeEach(async () => {
    // setup a DOM element as a render target
    container = document.createElement("div");
    document.body.appendChild(container);
  });
  it("checks that Omnibar has correct styles", async () => {
    // @ts-expect-error: AppHeader props are missing
    const { findByDataCy } = render(<AppHeader />);
    const appOmnibar = await findByDataCy("global-search-modal-trigger");
    act(() => {
      fireEvent.mouseOver(appOmnibar);
    });
    expect(appOmnibar).toHaveStyle({ border: "1.5px solid #FFFFFF;" });
  });
  afterEach(() => {
    // cleanup on exiting
    unmountComponentAtNode(container);
    container.remove();
    container = null;
  });
});
