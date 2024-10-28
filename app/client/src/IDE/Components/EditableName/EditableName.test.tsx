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

  const setup = ({
    forceEdit = false,
    isEditing = false,
    isLoading = false,
  }) => {
    // Define the props
    const props = {
      name,
      icon: <TabIcon />,
      isEditing,
      forceEdit,
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

      expect(onNameSave).not.toHaveBeenCalledWith(clickOutsideTitle);
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

      fireEvent.focusOut(inputElement);
      expect(getByRole("tooltip").textContent).toEqual("");
      expect(exitEditing).toHaveBeenCalled();
      expect(onNameSave).not.toHaveBeenCalledWith(invalidTitle);
    });

    test("prevents saving empty name", () => {
      const { getByRole, onNameSave } = setup({ isEditing: true });
      const input = getByRole("textbox");

      fireEvent.change(input, { target: { value: "" } });
      expect(getByRole("tooltip")).toHaveTextContent(
        "Please enter a valid name",
      );
      fireEvent.keyUp(input, KEY_CONFIG.ENTER);

      expect(onNameSave).not.toHaveBeenCalledWith("");
    });
  });

  describe("force Edit behaviour", () => {
    test("has the input in focus", () => {
      const { getByRole } = setup({
        isEditing: true,
        forceEdit: true,
      });
      const input = getByRole("textbox");

      expect(document.activeElement).toBe(input);
    });
    test("focus out will refocus input", () => {
      const { getByRole } = setup({
        isEditing: true,
        forceEdit: true,
      });
      const input = getByRole("textbox");

      fireEvent.focusOut(input);

      expect(document.activeElement).toBe(input);
    });
    test("keyboard interaction allows focus out", async () => {
      const { getByRole } = setup({
        isEditing: true,
        forceEdit: true,
      });
      const input = getByRole("textbox");

      expect(input).toBeInTheDocument();

      fireEvent.keyUp(input, { key: "U" });
      await userEvent.click(document.body);

      expect(document.activeElement).toBe(document.body);
    });
  });
});
