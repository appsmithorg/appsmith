/* eslint-disable react-perf/jsx-no-new-object-as-prop */
/* eslint-disable react-perf/jsx-no-jsx-as-prop */
import "@testing-library/jest-dom";
import React from "react";
import { render, fireEvent, screen } from "@testing-library/react";

import { Icon } from "@appsmith/ads";
import { DismissibleTab } from "./DismissibleTab";
import { DATA_TEST_ID } from "./constants";

describe("DismissibleTab", () => {
  const mockOnClick = jest.fn();
  const mockOnClose = jest.fn();
  const mockOnDoubleClick = jest.fn();

  const TITLE = "test_file";
  const TabIcon = () => <Icon name="js" />;

  const setup = () => {
    const utils = render(
      <DismissibleTab
        isActive
        onClick={mockOnClick}
        onClose={mockOnClose}
        onDoubleClick={mockOnDoubleClick}
      >
        <TabIcon />
        {TITLE}
      </DismissibleTab>,
    );
    // eslint-disable-next-line testing-library/prefer-screen-queries
    const tabElement = screen.getByText(TITLE);

    return {
      tabElement,
      ...utils,
    };
  };

  test("renders component", () => {
    const { getByTestId, tabElement } = setup();

    fireEvent.click(tabElement);
    expect(mockOnClick).toHaveBeenCalled();

    const closeButton = getByTestId(DATA_TEST_ID.CLOSE_BUTTON);

    fireEvent.click(closeButton);
    expect(mockOnClose).toHaveBeenCalled();
  });

  test("double click event is fired", () => {
    const { getByTestId, tabElement } = setup();

    fireEvent.doubleClick(tabElement);

    expect(mockOnDoubleClick).toHaveBeenCalled();

    const closeButton = getByTestId(DATA_TEST_ID.CLOSE_BUTTON);

    fireEvent.click(closeButton);
    expect(mockOnClose).toHaveBeenCalled();
  });
});
