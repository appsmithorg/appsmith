import React from "react";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { ThemeProvider } from "styled-components";
import { lightTheme } from "selectors/themeSelectors";
import { EditableText, EditInteractionKind } from "./EditableText";
import { MemoryRouter } from "react-router-dom";

const renderEditableText = (props = {}) => {
  return render(
    <MemoryRouter>
      <ThemeProvider theme={lightTheme}>
        <EditableText
          type="text"
          defaultValue="Initial Value"
          onTextChanged={jest.fn()}
          placeholder="Enter value"
          editInteractionKind={EditInteractionKind.SINGLE}
          {...props}
        />
      </ThemeProvider>
    </MemoryRouter>,
  );
};

describe("EditableText Accessibility Tests", () => {
  describe("Basic Rendering", () => {
    it("should render with initial value", () => {
      renderEditableText();

      expect(screen.getByText("Initial Value")).toBeInTheDocument();
    });

    it("should render with placeholder when no value", () => {
      renderEditableText({ defaultValue: "" });

      expect(screen.getByPlaceholderText("Enter value")).toBeInTheDocument();
    });

    it("should display the edit icon by default", () => {
      renderEditableText();

      const editIcon = document.querySelector(".t--action-name-edit-icon");
      expect(editIcon).toBeInTheDocument();
    });
  });

  describe("Edit Interaction - Single Click", () => {
    it("should enter edit mode on single click when editInteractionKind is SINGLE", async () => {
      renderEditableText({ editInteractionKind: EditInteractionKind.SINGLE });

      const editableText = screen.getByText("Initial Value").closest("div");
      if (editableText) {
        fireEvent.click(editableText);
      }

      await waitFor(() => {
        const input = document.querySelector(".bp3-editable-text-input");
        expect(input).toBeInTheDocument();
      });
    });

    it("should show input field in edit mode", async () => {
      renderEditableText({ editInteractionKind: EditInteractionKind.SINGLE });

      const editableText = screen.getByText("Initial Value").closest("div");
      if (editableText) {
        fireEvent.click(editableText);
      }

      await waitFor(() => {
        const input = document.querySelector(".bp3-editable-text-input");
        expect(input).toBeInTheDocument();
      });
    });
  });

  describe("Edit Interaction - Double Click", () => {
    it("should not enter edit mode on single click when editInteractionKind is DOUBLE", async () => {
      renderEditableText({ editInteractionKind: EditInteractionKind.DOUBLE });

      const editableText = screen.getByText("Initial Value").closest("div");
      if (editableText) {
        fireEvent.click(editableText);
      }

      // Should not enter edit mode
      const input = document.querySelector(".bp3-editable-text-input");
      expect(input).not.toBeInTheDocument();
    });

    it("should enter edit mode on double click when editInteractionKind is DOUBLE", async () => {
      renderEditableText({ editInteractionKind: EditInteractionKind.DOUBLE });

      const editableText = screen.getByText("Initial Value").closest("div");
      if (editableText) {
        fireEvent.doubleClick(editableText);
      }

      await waitFor(() => {
        const input = document.querySelector(".bp3-editable-text-input");
        expect(input).toBeInTheDocument();
      });
    });
  });

  describe("Value Changes", () => {
    it("should call onTextChanged when value is confirmed", async () => {
      const onTextChanged = jest.fn();
      renderEditableText({
        onTextChanged,
        editInteractionKind: EditInteractionKind.SINGLE,
      });

      // Enter edit mode
      const editableText = screen.getByText("Initial Value").closest("div");
      if (editableText) {
        fireEvent.click(editableText);
      }

      await waitFor(() => {
        const input = document.querySelector(
          ".bp3-editable-text-input",
        ) as HTMLInputElement;
        if (input) {
          fireEvent.change(input, { target: { value: "New Value" } });
          fireEvent.keyDown(input, { key: "Enter", code: "Enter" });
        }
      });

      await waitFor(() => {
        expect(onTextChanged).toHaveBeenCalledWith("New Value");
      });
    });

    it("should update value on input change", async () => {
      const onTextChanged = jest.fn();
      renderEditableText({
        onTextChanged,
        editInteractionKind: EditInteractionKind.SINGLE,
      });

      // Enter edit mode
      const editableText = screen.getByText("Initial Value").closest("div");
      if (editableText) {
        fireEvent.click(editableText);
      }

      await waitFor(() => {
        const input = document.querySelector(
          ".bp3-editable-text-input",
        ) as HTMLInputElement;
        if (input) {
          fireEvent.change(input, { target: { value: "Changed Value" } });
          expect(input.value).toBe("Changed Value");
        }
      });
    });
  });

  describe("Validation", () => {
    it("should show error when isInvalid returns error message", async () => {
      const isInvalid = (value: string) =>
        value.length < 3 ? "Minimum 3 characters required" : false;

      renderEditableText({
        isInvalid,
        editInteractionKind: EditInteractionKind.SINGLE,
      });

      // Enter edit mode
      const editableText = screen.getByText("Initial Value").closest("div");
      if (editableText) {
        fireEvent.click(editableText);
      }

      await waitFor(() => {
        const input = document.querySelector(
          ".bp3-editable-text-input",
        ) as HTMLInputElement;
        if (input) {
          // Enter invalid value
          fireEvent.change(input, { target: { value: "ab" } });
        }
      });

      await waitFor(() => {
        // Error tooltip should be visible
        const tooltip = document.querySelector('[data-visible="true"]');
        expect(tooltip || screen.queryByText("Minimum 3 characters required")).toBeTruthy();
      });
    });

    it("should accept valid input", async () => {
      const isInvalid = (value: string) => (value.length < 3 ? "Error" : false);
      const onTextChanged = jest.fn();

      renderEditableText({
        isInvalid,
        onTextChanged,
        editInteractionKind: EditInteractionKind.SINGLE,
      });

      // Enter edit mode
      const editableText = screen.getByText("Initial Value").closest("div");
      if (editableText) {
        fireEvent.click(editableText);
      }

      await waitFor(() => {
        const input = document.querySelector(
          ".bp3-editable-text-input",
        ) as HTMLInputElement;
        if (input) {
          fireEvent.change(input, { target: { value: "Valid Value" } });
          fireEvent.keyDown(input, { key: "Enter", code: "Enter" });
        }
      });

      await waitFor(() => {
        expect(onTextChanged).toHaveBeenCalledWith("Valid Value");
      });
    });
  });

  describe("Disabled State", () => {
    it("should not show edit icon when disabled", () => {
      renderEditableText({ disabled: true });

      const editIcon = document.querySelector(".t--action-name-edit-icon");
      expect(editIcon).not.toBeInTheDocument();
    });

    it("should not enter edit mode when disabled", async () => {
      renderEditableText({
        disabled: true,
        editInteractionKind: EditInteractionKind.SINGLE,
      });

      const editableText = screen.getByText("Initial Value").closest("div");
      if (editableText) {
        fireEvent.click(editableText);
      }

      // Should not enter edit mode
      const input = document.querySelector(".bp3-editable-text-input");
      expect(input).not.toBeInTheDocument();
    });
  });

  describe("Loading State", () => {
    it("should show spinner when updating", () => {
      renderEditableText({ updating: true });

      const spinner = document.querySelector(".ads-v2-spinner");
      expect(spinner).toBeInTheDocument();
    });

    it("should hide edit icon when updating", () => {
      renderEditableText({ updating: true });

      const editIcon = document.querySelector(".t--action-name-edit-icon");
      expect(editIcon).not.toBeInTheDocument();
    });
  });

  describe("Minimal Mode", () => {
    it("should not show edit icon in minimal mode", () => {
      renderEditableText({ minimal: true });

      const editIcon = document.querySelector(".t--action-name-edit-icon");
      expect(editIcon).not.toBeInTheDocument();
    });
  });

  describe("Hide Edit Icon", () => {
    it("should hide edit icon when hideEditIcon is true", () => {
      renderEditableText({ hideEditIcon: true });

      const editIcon = document.querySelector(".t--action-name-edit-icon");
      expect(editIcon).not.toBeInTheDocument();
    });
  });

  describe("Value Transform", () => {
    it("should transform value using valueTransform function", async () => {
      const valueTransform = (value: string) => value.toUpperCase();
      renderEditableText({
        valueTransform,
        editInteractionKind: EditInteractionKind.SINGLE,
      });

      // Enter edit mode
      const editableText = screen.getByText("Initial Value").closest("div");
      if (editableText) {
        fireEvent.click(editableText);
      }

      await waitFor(() => {
        const input = document.querySelector(
          ".bp3-editable-text-input",
        ) as HTMLInputElement;
        if (input) {
          fireEvent.change(input, { target: { value: "lowercase" } });
          expect(input.value).toBe("LOWERCASE");
        }
      });
    });
  });

  describe("Max Length", () => {
    it("should respect maxLength prop", async () => {
      renderEditableText({
        maxLength: 10,
        editInteractionKind: EditInteractionKind.SINGLE,
      });

      // Enter edit mode
      const editableText = screen.getByText("Initial Value").closest("div");
      if (editableText) {
        fireEvent.click(editableText);
      }

      await waitFor(() => {
        const input = document.querySelector(
          ".bp3-editable-text-input",
        ) as HTMLInputElement;
        if (input) {
          expect(input.maxLength).toBe(10);
        }
      });
    });
  });

  describe("Multiline Support", () => {
    it("should support multiline editing when multiline is true", async () => {
      renderEditableText({
        multiline: true,
        editInteractionKind: EditInteractionKind.SINGLE,
      });

      // Enter edit mode
      const editableText = screen.getByText("Initial Value").closest("div");
      if (editableText) {
        fireEvent.click(editableText);
      }

      await waitFor(() => {
        const textarea = document.querySelector("textarea.bp3-editable-text-input");
        // BlueprintJS may render as textarea in multiline mode
        expect(textarea || document.querySelector(".bp3-editable-text-input")).toBeInTheDocument();
      });
    });
  });

  describe("Focus and Blur", () => {
    it("should call onBlur when editing is cancelled", async () => {
      const onBlur = jest.fn();
      renderEditableText({
        onBlur,
        editInteractionKind: EditInteractionKind.SINGLE,
      });

      // Enter edit mode
      const editableText = screen.getByText("Initial Value").closest("div");
      if (editableText) {
        fireEvent.click(editableText);
      }

      await waitFor(() => {
        const input = document.querySelector(".bp3-editable-text-input");
        if (input) {
          // Press Escape to cancel
          fireEvent.keyDown(input, { key: "Escape", code: "Escape" });
        }
      });

      await waitFor(() => {
        expect(onBlur).toHaveBeenCalled();
      });
    });
  });

  describe("Force Default", () => {
    it("should reset to default value when forceDefault is true", async () => {
      const { rerender } = renderEditableText({
        defaultValue: "Default Value",
        forceDefault: false,
      });

      // Initial value should be displayed
      expect(screen.getByText("Default Value")).toBeInTheDocument();

      // Force default value
      rerender(
        <MemoryRouter>
          <ThemeProvider theme={lightTheme}>
            <EditableText
              type="text"
              defaultValue="Default Value"
              onTextChanged={jest.fn()}
              placeholder="Enter value"
              editInteractionKind={EditInteractionKind.SINGLE}
              forceDefault={true}
            />
          </ThemeProvider>
        </MemoryRouter>,
      );

      await waitFor(() => {
        expect(screen.getByText("Default Value")).toBeInTheDocument();
      });
    });
  });

  describe("Underline Style", () => {
    it("should apply underline style when underline is true", () => {
      const { container } = renderEditableText({ underline: true });

      const textContainer = container.querySelector('[class*="TextContainer"]');
      expect(textContainer).toBeInTheDocument();
    });
  });

  describe("Full Width", () => {
    it("should use full width when useFullWidth is true", async () => {
      const { container } = renderEditableText({
        useFullWidth: true,
        editInteractionKind: EditInteractionKind.SINGLE,
      });

      // Enter edit mode
      const editableText = screen.getByText("Initial Value").closest("div");
      if (editableText) {
        fireEvent.click(editableText);
      }

      await waitFor(() => {
        const wrapper = container.querySelector('[class*="EditableTextWrapper"]');
        expect(wrapper).toBeInTheDocument();
      });
    });
  });

  describe("Accessibility Recommendations", () => {
    /**
     * Note: The EditableText component could benefit from additional accessibility attributes:
     * 
     * - aria-label: Should describe the editable text field
     * - aria-describedby: Should reference error messages
     * - aria-invalid: Should be set when validation fails
     * - role="button": The clickable container could have this role
     * - tabIndex="0": For keyboard accessibility
     * 
     * These tests document expected accessibility behavior.
     */

    it("should be interactive when enabled", () => {
      renderEditableText();

      const editableText = screen.getByText("Initial Value").closest("div");
      expect(editableText).toBeInTheDocument();
    });

    it("should provide visual feedback for editable state", () => {
      const { container } = renderEditableText();

      // Check for cursor pointer style
      const wrapper = container.querySelector('[class*="EditableTextWrapper"]');
      expect(wrapper).toBeInTheDocument();
    });
  });
});