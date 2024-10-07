/* eslint-disable react-perf/jsx-no-new-object-as-prop */
/* eslint-disable react-perf/jsx-no-jsx-as-prop */
import "@testing-library/jest-dom";
import React from "react";
import { render, fireEvent, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { Icon } from "@appsmith/ads";
import { FileTab } from "./FileTab";
import { DATA_TEST_ID } from "./constants";

describe("FileTab", () => {
  const mockOnClick = jest.fn();
  const mockOnClose = jest.fn();

  const title = "test_file";
  const TabIcon = () => <Icon name="js" />;

  const setup = (
    mockEditorConfig: {
      onTitleSave: () => void;
      titleTransformer: (title: string) => string;
      validateTitle: (title: string) => string | null;
    } = {
      onTitleSave: jest.fn(),
      titleTransformer: jest.fn((title) => title),
      validateTitle: jest.fn(() => null),
    },
    isLoading = false,
  ) => {
    const utils = render(
      <FileTab
        editorConfig={mockEditorConfig}
        icon={<TabIcon />}
        isActive
        isLoading={isLoading}
        onClick={mockOnClick}
        onClose={mockOnClose}
        title={title}
      />,
    );
    const tabElement = utils.getByText(title);

    return {
      tabElement,
      ...utils,
      ...mockEditorConfig,
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

  test("renders component in loading state", () => {
    const { getByTestId, tabElement } = setup(undefined, true);

    fireEvent.click(tabElement);
    expect(mockOnClick).toHaveBeenCalled();

    const spinner = getByTestId(DATA_TEST_ID.SPINNER);

    fireEvent.click(spinner);

    const closeButton = getByTestId(DATA_TEST_ID.CLOSE_BUTTON);

    fireEvent.click(closeButton);
    expect(mockOnClose).toHaveBeenCalled();
  });

  test("enters edit mode on double click", () => {
    const { getByTestId, tabElement } = setup();

    fireEvent.doubleClick(tabElement);
    within(tabElement).getByTestId(DATA_TEST_ID.INPUT);

    const closeButton = getByTestId(DATA_TEST_ID.CLOSE_BUTTON);

    fireEvent.click(closeButton);
    expect(mockOnClose).toHaveBeenCalled();
  });

  test("edit and hit enter", () => {
    const {
      getByTestId,
      getByText,
      onTitleSave,
      tabElement,
      titleTransformer,
      validateTitle,
    } = setup();

    const newTitle = "new_title";

    fireEvent.doubleClick(tabElement);
    const inputElement = getByTestId(DATA_TEST_ID.INPUT);

    fireEvent.change(inputElement, { target: { value: newTitle } });
    expect(titleTransformer).toHaveBeenCalledWith(newTitle);

    fireEvent.keyUp(inputElement, { key: "Enter", keyCode: 13 });

    expect(titleTransformer).toHaveBeenCalledWith(newTitle);
    expect(validateTitle).toHaveBeenCalledWith(newTitle);
    expect(onTitleSave).toHaveBeenCalledWith(newTitle);

    expect(getByText(newTitle)).toBeInTheDocument();
  });

  test("edit and click outside", async () => {
    const {
      getByTestId,
      getByText,
      onTitleSave,
      tabElement,
      titleTransformer,
      validateTitle,
    } = setup();

    const newTitle = "new_title";

    fireEvent.doubleClick(tabElement);
    const inputElement = getByTestId(DATA_TEST_ID.INPUT);

    fireEvent.change(inputElement, { target: { value: newTitle } });
    expect(titleTransformer).toHaveBeenCalledWith(newTitle);

    await userEvent.click(document.body);

    expect(titleTransformer).toHaveBeenCalledWith(newTitle);
    expect(validateTitle).toHaveBeenCalledWith(newTitle);
    expect(onTitleSave).toHaveBeenCalledWith(newTitle);

    expect(getByText(newTitle)).toBeInTheDocument();
  });

  test("edit and hit esc", () => {
    const {
      getByTestId,
      getByText,
      queryByText,
      tabElement,
      titleTransformer,
    } = setup();

    const newTitle = "new_title";

    fireEvent.doubleClick(tabElement);
    const inputElement = getByTestId(DATA_TEST_ID.INPUT);

    fireEvent.change(inputElement, { target: { value: newTitle } });
    expect(titleTransformer).toHaveBeenCalledWith(newTitle);

    fireEvent.keyUp(inputElement, { key: "Esc", keyCode: 27 });

    const newTab = queryByText(newTitle);
    const oldTab = getByText(title);

    expect(newTab).not.toBeInTheDocument();
    expect(oldTab).toBeInTheDocument();
  });

  test("enter invalid title", () => {
    const validationError = "Invalid title";

    const {
      getByTestId,
      getByText,
      tabElement,
      titleTransformer,
      validateTitle,
    } = setup({
      onTitleSave: jest.fn(),
      titleTransformer: jest.fn((title) => title),
      validateTitle: jest.fn(() => validationError),
    });

    const invalidTitle = "else";

    fireEvent.doubleClick(tabElement);
    const inputElement = getByTestId(DATA_TEST_ID.INPUT);

    fireEvent.change(inputElement, { target: { value: invalidTitle } });
    expect(titleTransformer).toHaveBeenCalledWith(invalidTitle);

    fireEvent.keyUp(inputElement, { key: "Enter", keyCode: 13 });

    expect(titleTransformer).toHaveBeenCalledWith(invalidTitle);
    expect(validateTitle).toHaveBeenCalledWith(invalidTitle);

    const tooltip = getByText(validationError);

    expect(tooltip).toBeInTheDocument();
  });
});
