import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

import { TabOrderBadge } from "./TabOrderBadge";
import { showTabOrderOverlaySelector } from "selectors/editorSelectors";
import { selectCombinedPreviewMode } from "selectors/gitModSelectors";

const mockState = {
  showOverlay: false,
  isPreviewMode: false,
};

jest.mock("react-redux", () => ({
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  useSelector: (selector: any) => selector(),
}));

jest.mock("selectors/editorSelectors", () => ({
  showTabOrderOverlaySelector: jest.fn(),
}));

jest.mock("selectors/gitModSelectors", () => ({
  selectCombinedPreviewMode: jest.fn(),
}));

beforeEach(() => {
  mockState.showOverlay = false;
  mockState.isPreviewMode = false;
  (showTabOrderOverlaySelector as jest.Mock).mockImplementation(
    () => mockState.showOverlay,
  );
  (selectCombinedPreviewMode as unknown as jest.Mock).mockImplementation(
    () => mockState.isPreviewMode,
  );
});

function badge() {
  return screen.queryByTestId("t--tab-order-badge");
}

describe("TabOrderBadge", () => {
  it("renders the tab order when the overlay is on", () => {
    mockState.showOverlay = true;

    render(<TabOrderBadge tabOrder={3} />);

    expect(badge()).toHaveTextContent("3");
  });

  it("renders 1 as the earliest valid value", () => {
    mockState.showOverlay = true;

    render(<TabOrderBadge tabOrder={1} />);

    expect(badge()).toHaveTextContent("1");
  });

  it("renders nothing when the overlay is off", () => {
    render(<TabOrderBadge tabOrder={3} />);

    expect(badge()).not.toBeInTheDocument();
  });

  it("renders nothing in preview mode", () => {
    mockState.showOverlay = true;
    mockState.isPreviewMode = true;

    render(<TabOrderBadge tabOrder={3} />);

    expect(badge()).not.toBeInTheDocument();
  });

  it("renders nothing when tabOrder is absent", () => {
    mockState.showOverlay = true;

    render(<TabOrderBadge />);

    expect(badge()).not.toBeInTheDocument();
  });

  it("renders nothing for invalid values", () => {
    mockState.showOverlay = true;

    for (const value of [0, -1, 1.5, "abc", null, ""]) {
      const { unmount } = render(<TabOrderBadge tabOrder={value} />);

      expect(badge()).not.toBeInTheDocument();
      unmount();
    }
  });
});
