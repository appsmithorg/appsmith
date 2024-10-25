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

  const TITLE = "test_file";
  const TabIcon = () => <Icon name="js" />;
  const KEY_CONFIG = {
    ENTER: { key: "Enter", keyCode: 13 },
    ESC: { key: "Esc", keyCode: 27 },
  };

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
        isChangePermitted
        isLoading={isLoading}
        onClick={mockOnClick}
        onClose={mockOnClose}
        title={TITLE}
      />,
    );
    const tabElement = utils.getByText(TITLE);

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

  test("valid title actions", async () => {
    const {
      getByTestId,
      getByText,
      onTitleSave,
      queryByText,
      tabElement,
      titleTransformer,
      validateTitle,
    } = setup();

    // hit enter
    const enterTitle = "enter_title";

    fireEvent.doubleClick(tabElement);
    fireEvent.change(getByTestId(DATA_TEST_ID.INPUT), {
      target: { value: enterTitle },
    });
    expect(titleTransformer).toHaveBeenCalledWith(enterTitle);

    fireEvent.keyUp(getByTestId(DATA_TEST_ID.INPUT), KEY_CONFIG.ENTER);
    expect(titleTransformer).toHaveBeenCalledWith(enterTitle);
    expect(validateTitle).toHaveBeenCalledWith(enterTitle);
    expect(onTitleSave).toHaveBeenCalledWith(enterTitle);
    expect(getByText(enterTitle)).toBeInTheDocument();

    // click outside
    const clickOutsideTitle = "click_outside_title";

    fireEvent.doubleClick(tabElement);
    fireEvent.change(getByTestId(DATA_TEST_ID.INPUT), {
      target: { value: clickOutsideTitle },
    });
    expect(titleTransformer).toHaveBeenCalledWith(clickOutsideTitle);

    await userEvent.click(document.body);
    expect(titleTransformer).toHaveBeenCalledWith(clickOutsideTitle);
    expect(validateTitle).toHaveBeenCalledWith(clickOutsideTitle);
    expect(onTitleSave).toHaveBeenCalledWith(clickOutsideTitle);
    expect(getByText(clickOutsideTitle)).toBeInTheDocument();

    // hit esc
    const escapeTitle = "escape_title";

    fireEvent.doubleClick(tabElement);
    fireEvent.change(getByTestId(DATA_TEST_ID.INPUT), {
      target: { value: escapeTitle },
    });
    expect(titleTransformer).toHaveBeenCalledWith(escapeTitle);

    fireEvent.keyUp(getByTestId(DATA_TEST_ID.INPUT), KEY_CONFIG.ESC);
    expect(queryByText(escapeTitle)).not.toBeInTheDocument();
    expect(getByText(TITLE)).toBeInTheDocument();

    // focus out event
    const focusOutTitle = "focus_out_title";

    fireEvent.doubleClick(tabElement);
    fireEvent.change(getByTestId(DATA_TEST_ID.INPUT), {
      target: { value: focusOutTitle },
    });
    expect(titleTransformer).toHaveBeenCalledWith(focusOutTitle);

    fireEvent.keyUp(getByTestId(DATA_TEST_ID.INPUT), KEY_CONFIG.ESC);
    expect(queryByText(focusOutTitle)).not.toBeInTheDocument();
    expect(getByText(TITLE)).toBeInTheDocument();
  });

  test("invalid title actions", async () => {
    const validationError = "Invalid title";
    const invalidTitle = "else";

    const {
      getByTestId,
      getByText,
      queryByText,
      tabElement,
      titleTransformer,
      validateTitle,
    } = setup({
      onTitleSave: jest.fn(),
      titleTransformer: jest.fn((title) => title),
      validateTitle: jest.fn(() => validationError),
    });

    // click outside
    fireEvent.doubleClick(tabElement);
    fireEvent.change(getByTestId(DATA_TEST_ID.INPUT), {
      target: { value: invalidTitle },
    });
    expect(titleTransformer).toHaveBeenCalledWith(invalidTitle);

    fireEvent.keyUp(getByTestId(DATA_TEST_ID.INPUT), KEY_CONFIG.ENTER);
    expect(titleTransformer).toHaveBeenCalledWith(invalidTitle);
    expect(validateTitle).toHaveBeenCalledWith(invalidTitle);
    expect(getByText(validationError)).toBeInTheDocument();

    await userEvent.click(document.body);
    expect(queryByText(validationError)).not.toBeInTheDocument();
    expect(getByText(TITLE)).toBeInTheDocument();

    // escape
    fireEvent.doubleClick(tabElement);
    fireEvent.change(getByTestId(DATA_TEST_ID.INPUT), {
      target: { value: invalidTitle },
    });
    expect(titleTransformer).toHaveBeenCalledWith(invalidTitle);

    fireEvent.keyUp(getByTestId(DATA_TEST_ID.INPUT), KEY_CONFIG.ENTER);
    fireEvent.keyUp(getByTestId(DATA_TEST_ID.INPUT), KEY_CONFIG.ESC);
    expect(queryByText(validationError)).not.toBeInTheDocument();
    expect(getByText(TITLE)).toBeInTheDocument();

    // focus out event
    fireEvent.doubleClick(tabElement);
    fireEvent.change(getByTestId(DATA_TEST_ID.INPUT), {
      target: { value: invalidTitle },
    });
    expect(titleTransformer).toHaveBeenCalledWith(invalidTitle);

    fireEvent.keyUp(getByTestId(DATA_TEST_ID.INPUT), KEY_CONFIG.ENTER);
    fireEvent.focusOut(getByTestId(DATA_TEST_ID.INPUT));
    expect(queryByText(validationError)).not.toBeInTheDocument();
    expect(getByText(TITLE)).toBeInTheDocument();
  });
});
