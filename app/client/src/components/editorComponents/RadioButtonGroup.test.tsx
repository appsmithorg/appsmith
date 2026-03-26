import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { ThemeProvider } from "styled-components";
import { lightTheme } from "selectors/themeSelectors";
import RadioButtonGroup from "./RadioButtonGroup";

// Mock the redux-form types
const mockMeta = {
  invalid: false,
  touched: false,
  error: "",
};

const mockInput = {
  onChange: jest.fn(),
  value: "",
};

const defaultOptions = [
  { label: "Option 1", value: "option1", subtext: "Subtext for option 1" },
  { label: "Option 2", value: "option2", subtext: "Subtext for option 2" },
  { label: "Option 3", value: "option3", subtext: "Subtext for option 3" },
];

const renderRadioButtonGroup = (props = {}) => {
  return render(
    <ThemeProvider theme={lightTheme}>
      <RadioButtonGroup
        label="Test Radio Group"
        options={defaultOptions}
        initialValue=""
        testid="test-radio-group"
        {...props}
      />
    </ThemeProvider>,
  );
};

describe("RadioButtonGroup Accessibility Tests", () => {
  describe("ARIA Attributes", () => {
    it("should have role='radiogroup' on the container", () => {
      renderRadioButtonGroup();

      const radioGroup = screen.getByRole("radiogroup");
      expect(radioGroup).toBeInTheDocument();
    });

    it("should have aria-label on the radio group", () => {
      renderRadioButtonGroup({ label: "Custom Label" });

      const radioGroup = screen.getByRole("radiogroup");
      expect(radioGroup).toHaveAttribute("aria-label", "Custom Label");
    });

    it("should have role='radio' on each radio button", () => {
      renderRadioButtonGroup();

      const radioButtons = screen.getAllByRole("radio");
      expect(radioButtons).toHaveLength(3);
    });

    it("should have aria-checked='false' on unselected radio buttons", () => {
      renderRadioButtonGroup();

      const radioButtons = screen.getAllByRole("radio");
      radioButtons.forEach((button) => {
        expect(button).toHaveAttribute("aria-checked", "false");
      });
    });

    it("should have aria-checked='true' on the selected radio button", async () => {
      renderRadioButtonGroup({ initialValue: "option1" });

      await waitFor(() => {
        const radioButtons = screen.getAllByRole("radio");
        const selectedButton = radioButtons.find(
          (btn) => btn.getAttribute("data-value") === "option1",
        );
        expect(selectedButton).toHaveAttribute("aria-checked", "true");
      });
    });

    it("should update aria-checked when selection changes", async () => {
      renderRadioButtonGroup();

      const radioButtons = screen.getAllByRole("radio");
      const firstButton = radioButtons[0];

      fireEvent.click(firstButton);

      await waitFor(() => {
        expect(firstButton).toHaveAttribute("aria-checked", "true");

        // Other buttons should still be unchecked
        const otherButtons = radioButtons.slice(1);
        otherButtons.forEach((btn) => {
          expect(btn).toHaveAttribute("aria-checked", "false");
        });
      });
    });

    it("should have data-value attribute for each radio button", () => {
      renderRadioButtonGroup();

      const radioButtons = screen.getAllByRole("radio");
      expect(radioButtons[0]).toHaveAttribute("data-value", "option1");
      expect(radioButtons[1]).toHaveAttribute("data-value", "option2");
      expect(radioButtons[2]).toHaveAttribute("data-value", "option3");
    });

    it("should have data-label attribute for each radio button", () => {
      renderRadioButtonGroup();

      const radioButtons = screen.getAllByRole("radio");
      expect(radioButtons[0]).toHaveAttribute("data-label", "Option 1");
      expect(radioButtons[1]).toHaveAttribute("data-label", "Option 2");
      expect(radioButtons[2]).toHaveAttribute("data-label", "Option 3");
    });
  });

  describe("Keyboard Navigation", () => {
    it("should select radio button on click", async () => {
      renderRadioButtonGroup();

      const radioButtons = screen.getAllByRole("radio");
      fireEvent.click(radioButtons[1]);

      await waitFor(() => {
        expect(radioButtons[1]).toHaveAttribute("aria-checked", "true");
      });
    });

    it("should call input.onChange when selection changes", async () => {
      const input = { ...mockInput };
      renderRadioButtonGroup({ input });

      const radioButtons = screen.getAllByRole("radio");
      fireEvent.click(radioButtons[0]);

      await waitFor(() => {
        expect(input.onChange).toHaveBeenCalledWith("option1");
      });
    });

    it("should have accessible button labels", () => {
      renderRadioButtonGroup();

      expect(screen.getByText("Option 1")).toBeInTheDocument();
      expect(screen.getByText("Option 2")).toBeInTheDocument();
      expect(screen.getByText("Option 3")).toBeInTheDocument();
    });
  });

  describe("Error State Accessibility", () => {
    it("should display error message when meta is invalid and touched", () => {
      renderRadioButtonGroup({
        meta: { ...mockMeta, invalid: true, touched: true, error: "Required field" },
      });

      expect(screen.getByText("Required field")).toBeInTheDocument();
    });

    it("should not display error message when field is not touched", () => {
      renderRadioButtonGroup({
        meta: { ...mockMeta, invalid: true, touched: false, error: "Required field" },
      });

      expect(screen.queryByText("Required field")).not.toBeInTheDocument();
    });

    it("should have error container with proper styling", () => {
      const { container } = renderRadioButtonGroup({
        meta: { ...mockMeta, invalid: true, touched: true, error: "Error" },
      });

      const errorContainer = container.querySelector(".dropdown-errorMsg");
      expect(errorContainer).toBeInTheDocument();
    });
  });

  describe("Subtitle Accessibility", () => {
    it("should display subtitle for selected option when showSubtitle is true", async () => {
      renderRadioButtonGroup({ showSubtitle: true, initialValue: "option1" });

      await waitFor(() => {
        expect(screen.getByText("Subtext for option 1")).toBeInTheDocument();
      });
    });

    it("should update subtitle when selection changes", async () => {
      renderRadioButtonGroup({ showSubtitle: true });

      const radioButtons = screen.getAllByRole("radio");
      fireEvent.click(radioButtons[1]);

      await waitFor(() => {
        expect(screen.getByText("Subtext for option 2")).toBeInTheDocument();
      });
    });

    it("should not display subtitle when showSubtitle is false", () => {
      renderRadioButtonGroup({ showSubtitle: false, initialValue: "option1" });

      expect(screen.queryByText("Subtext for option 1")).not.toBeInTheDocument();
    });
  });

  describe("Screen Reader Support", () => {
    it("should have a visible heading for the radio group", () => {
      renderRadioButtonGroup({ label: "Choose an option" });

      const heading = screen.getByRole("heading", { name: "Choose an option" });
      expect(heading).toBeInTheDocument();
    });

    it("should associate radio buttons with their labels", () => {
      renderRadioButtonGroup();

      const radioButtons = screen.getAllByRole("radio");
      expect(radioButtons[0]).toHaveTextContent("Option 1");
      expect(radioButtons[1]).toHaveTextContent("Option 2");
      expect(radioButtons[2]).toHaveTextContent("Option 3");
    });
  });

  describe("Focus Management", () => {
    it("should have tabIndex on radio buttons", () => {
      renderRadioButtonGroup();

      const radioButtons = screen.getAllByRole("radio");
      radioButtons.forEach((button) => {
        expect(button).toHaveAttribute("tabIndex");
      });
    });
  });
});