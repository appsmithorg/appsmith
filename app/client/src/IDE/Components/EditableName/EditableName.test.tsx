import React from "react";
import { EditableName } from "./EditableName";
import { render } from "test/testUtils";
import "@testing-library/jest-dom";
import { Icon } from "@appsmith/ads";
import { fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

describe("EditableName", () => {
  const mockOnNameSave = jest.fn();
  const mockOnExitEditing = jest.fn();

  const name = "test_name";
  const TabIcon = () => <Icon name="js" />;
  const KEY_CONFIG = {
    ENTER: { key: "Enter", keyCode: 13 },
    ESC: { key: "Esc", keyCode: 27 },
  };

  const setup = ({ isEditing = false, isLoading = false }) => {
    // Define the props
    const props = {
      name,
      icon: <TabIcon />,
      isEditing,
      onNameSave: mockOnNameSave,
      exitEditing: mockOnExitEditing,
      isLoading,
    };

    // Render the component
    const utils = render(<EditableName {...props} />);

    return {
      ...props,
      ...utils,
    };
  };

  test("renders component", () => {
    const utils = setup({});
    const editableNameElement = utils.getByText(utils.name);

    expect(editableNameElement).toBeInTheDocument();
    expect(editableNameElement.textContent).toBe(name);
  });

  test("renders input when editing", () => {
    const utils = setup({ isEditing: true });

    const editableNameElement = utils.queryByText(utils.name);

    expect(editableNameElement).not.toBeInTheDocument();

    const inputElement = utils.getByRole("textbox");

    expect(inputElement).toBeInTheDocument();
  });

  describe("valid input actions", () => {
    test("submit event", async () => {
      const { exitEditing, getByRole, onNameSave } = setup({
        isEditing: true,
      });

      // hit enter
      const enterTitle = "enter_title";

      fireEvent.change(getByRole("textbox"), {
        target: { value: enterTitle },
      });
      expect(getByRole("textbox")).toHaveValue(enterTitle);

      fireEvent.keyUp(getByRole("textbox"), KEY_CONFIG.ENTER);

      expect(onNameSave).toHaveBeenCalledWith(enterTitle);
      expect(exitEditing).toHaveBeenCalled();
    });

    test("outside click event", async () => {
      const { exitEditing, getByRole, onNameSave } = setup({
        isEditing: true,
      });

      const clickOutsideTitle = "click_outside_title";

      fireEvent.change(getByRole("textbox"), {
        target: { value: clickOutsideTitle },
      });

      await userEvent.click(document.body);

      expect(onNameSave).toHaveBeenCalledWith(clickOutsideTitle);
      expect(exitEditing).toHaveBeenCalled();
    });

    test("esc key event", async () => {
      const escapeTitle = "escape_title";

      const { exitEditing, getByRole, onNameSave } = setup({
        isEditing: true,
      });

      fireEvent.change(getByRole("textbox"), {
        target: { value: escapeTitle },
      });

      fireEvent.keyUp(getByRole("textbox"), KEY_CONFIG.ESC);

      expect(exitEditing).toHaveBeenCalled();
      expect(onNameSave).not.toHaveBeenCalledWith(escapeTitle);
    });

    test("focus out event", async () => {
      const focusOutTitle = "focus_out_title";

      const { exitEditing, getByRole, onNameSave } = setup({
        isEditing: true,
      });

      const inputElement = getByRole("textbox");

      fireEvent.change(inputElement, {
        target: { value: focusOutTitle },
      });

      fireEvent.keyUp(inputElement, KEY_CONFIG.ESC);
      expect(exitEditing).toHaveBeenCalled();
      expect(onNameSave).not.toHaveBeenCalledWith(focusOutTitle);
    });
  });

  describe("invalid input actions", () => {
    const invalidTitle = "else";
    const validationError =
      "else is already being used or is a restricted keyword.";

    test("click outside", async () => {
      const { exitEditing, getByRole, onNameSave } = setup({
        isEditing: true,
      });
      const inputElement = getByRole("textbox");

      fireEvent.change(inputElement, {
        target: { value: invalidTitle },
      });

      fireEvent.keyUp(inputElement, KEY_CONFIG.ENTER);

      expect(getByRole("tooltip")).toBeInTheDocument();

      expect(getByRole("tooltip").textContent).toEqual(validationError);

      await userEvent.click(document.body);

      expect(getByRole("tooltip").textContent).toEqual("");

      expect(exitEditing).toHaveBeenCalled();
      expect(onNameSave).not.toHaveBeenCalledWith(invalidTitle);
    });

    test("esc key", async () => {
      const { exitEditing, getByRole, onNameSave } = setup({
        isEditing: true,
      });
      const inputElement = getByRole("textbox");

      fireEvent.change(inputElement, {
        target: { value: invalidTitle },
      });

      fireEvent.keyUp(inputElement, KEY_CONFIG.ENTER);
      fireEvent.keyUp(inputElement, KEY_CONFIG.ESC);

      expect(getByRole("tooltip")).toBeInTheDocument();

      expect(getByRole("tooltip").textContent).toEqual("");
      expect(exitEditing).toHaveBeenCalled();
      expect(onNameSave).not.toHaveBeenCalledWith(invalidTitle);
    });

    test("focus out event", async () => {
      const { exitEditing, getByRole, onNameSave } = setup({
        isEditing: true,
      });
      const inputElement = getByRole("textbox");

      fireEvent.change(inputElement, {
        target: { value: invalidTitle },
      });

      fireEvent.keyUp(inputElement, KEY_CONFIG.ENTER);
      fireEvent.focusOut(inputElement);
      expect(getByRole("tooltip").textContent).toEqual("");
      expect(exitEditing).toHaveBeenCalled();
      expect(onNameSave).not.toHaveBeenCalledWith(invalidTitle);
    });
  });
});
