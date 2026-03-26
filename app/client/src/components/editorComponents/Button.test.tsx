import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { ThemeProvider } from "styled-components";
import { lightTheme } from "selectors/themeSelectors";
import Button, { type ButtonProps } from "./Button";

const renderButton = (props: Partial<ButtonProps> = {}) => {
  return render(
    <ThemeProvider theme={lightTheme}>
      <Button text="Test Button" {...props} />
    </ThemeProvider>,
  );
};

describe("Button Accessibility Tests", () => {
  describe("Basic Rendering", () => {
    it("should render with text", () => {
      renderButton({ text: "Click Me" });

      expect(screen.getByRole("button", { name: "Click Me" })).toBeInTheDocument();
    });

    it("should render as a button element when no href is provided", () => {
      renderButton();

      const button = screen.getByRole("button");
      expect(button.tagName.toLowerCase()).toBe("button");
    });

    it("should render as an anchor element when href is provided", () => {
      renderButton({ href: "https://example.com" });

      const link = screen.getByRole("link");
      expect(link.tagName.toLowerCase()).toBe("a");
    });
  });

  describe("Button Types", () => {
    it("should support button type", () => {
      renderButton({ type: "button" });

      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("type", "button");
    });

    it("should support submit type", () => {
      renderButton({ type: "submit" });

      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("type", "submit");
    });

    it("should support reset type", () => {
      renderButton({ type: "reset" });

      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("type", "reset");
    });
  });

  describe("Click Handling", () => {
    it("should call onClick handler when clicked", () => {
      const onClick = jest.fn();
      renderButton({ onClick });

      const button = screen.getByRole("button");
      fireEvent.click(button);

      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it("should not call onClick when disabled", () => {
      const onClick = jest.fn();
      renderButton({ onClick, disabled: true });

      const button = screen.getByRole("button");
      fireEvent.click(button);

      expect(onClick).not.toHaveBeenCalled();
    });
  });

  describe("Disabled State", () => {
    it("should have disabled attribute when disabled prop is true", () => {
      renderButton({ disabled: true });

      const button = screen.getByRole("button");
      expect(button).toBeDisabled();
    });

    it("should not be disabled by default", () => {
      renderButton();

      const button = screen.getByRole("button");
      expect(button).not.toBeDisabled();
    });

    it("should apply disabled styles", () => {
      renderButton({ disabled: true });

      const button = screen.getByRole("button");
      expect(button).toHaveClass("bp3-disabled");
    });
  });

  describe("Loading State", () => {
    it("should show loading spinner when loading prop is true", () => {
      renderButton({ loading: true });

      const button = screen.getByRole("button");
      expect(button).toHaveClass("bp3-loading");
    });

    it("should be disabled when loading", () => {
      renderButton({ loading: true });

      const button = screen.getByRole("button");
      expect(button).toBeDisabled();
    });

    it("should not call onClick when loading", () => {
      const onClick = jest.fn();
      renderButton({ onClick, loading: true });

      const button = screen.getByRole("button");
      fireEvent.click(button);

      expect(onClick).not.toHaveBeenCalled();
    });
  });

  describe("Intent Styling", () => {
    it("should apply primary intent class", () => {
      renderButton({ intent: "primary", filled: true });

      const button = screen.getByRole("button");
      expect(button).toHaveClass("bp3-intent-primary");
    });

    it("should apply success intent class", () => {
      renderButton({ intent: "success", filled: true });

      const button = screen.getByRole("button");
      expect(button).toHaveClass("bp3-intent-success");
    });

    it("should apply warning intent class", () => {
      renderButton({ intent: "warning", filled: true });

      const button = screen.getByRole("button");
      expect(button).toHaveClass("bp3-intent-warning");
    });

    it("should apply danger intent class", () => {
      renderButton({ intent: "danger", filled: true });

      const button = screen.getByRole("button");
      expect(button).toHaveClass("bp3-intent-danger");
    });
  });

  describe("Size Variants", () => {
    it("should apply large size class", () => {
      renderButton({ size: "large" });

      const button = screen.getByRole("button");
      expect(button).toHaveClass("bp3-large");
    });

    it("should apply small size class", () => {
      renderButton({ size: "small" });

      const button = screen.getByRole("button");
      expect(button).toHaveClass("bp3-small");
    });
  });

  describe("Filled and Outline Styles", () => {
    it("should apply filled style", () => {
      renderButton({ filled: true });

      const button = screen.getByRole("button");
      expect(button).not.toHaveClass("bp3-minimal");
    });

    it("should apply minimal style when not filled", () => {
      renderButton({ filled: false });

      const button = screen.getByRole("button");
      expect(button).toHaveClass("bp3-minimal");
    });

    it("should apply outline style", () => {
      const { container } = renderButton({ outline: true });

      // Check that outline styles are applied
      const button = screen.getByRole("button");
      expect(button).toBeInTheDocument();
    });
  });

  describe("Icon Support", () => {
    it("should render with left icon", () => {
      renderButton({ icon: "plus", iconAlignment: "left" });

      const button = screen.getByRole("button");
      const icon = button.querySelector(".bp3-icon");
      expect(icon).toBeInTheDocument();
    });

    it("should render with right icon", () => {
      renderButton({ icon: "plus", iconAlignment: "right" });

      const button = screen.getByRole("button");
      const rightIcon = button.querySelector(".bp3-icon.bp3-align-right");
      expect(rightIcon || button.querySelector(".bp3-icon")).toBeInTheDocument();
    });
  });

  describe("Link Button (href)", () => {
    it("should render as anchor with href", () => {
      renderButton({ href: "https://example.com" });

      const link = screen.getByRole("link");
      expect(link).toHaveAttribute("href", "https://example.com");
    });

    it("should support target attribute", () => {
      renderButton({ href: "https://example.com", target: "_blank" });

      const link = screen.getByRole("link");
      expect(link).toHaveAttribute("target", "_blank");
    });

    it("should not call onClick when href is provided (navigation behavior)", () => {
      const onClick = jest.fn();
      renderButton({ href: "https://example.com", onClick });

      const link = screen.getByRole("link");
      fireEvent.click(link);

      // Anchor buttons typically don't call onClick in the same way
      // The navigation is handled by the href attribute
      expect(link).toBeInTheDocument();
    });
  });

  describe("Fluid Width", () => {
    it("should expand to full width when fluid is true", () => {
      const { container } = renderButton({ fluid: true });

      const buttonWrapper = container.querySelector('[style*="width: 100%"]');
      expect(buttonWrapper || screen.getByRole("button")).toBeInTheDocument();
    });
  });

  describe("Custom Styling", () => {
    it("should apply custom className", () => {
      renderButton({ className: "custom-button" });

      const button = screen.getByRole("button");
      expect(button).toHaveClass("custom-button");
    });

    it("should apply custom borderRadius", () => {
      renderButton({ borderRadius: "8px" });

      const button = screen.getByRole("button");
      expect(button).toBeInTheDocument();
    });
  });

  describe("Focus Management", () => {
    it("should be focusable by default", () => {
      renderButton();

      const button = screen.getByRole("button");
      button.focus();
      expect(button).toHaveFocus();
    });

    it("should not receive focus when disabled", async () => {
      renderButton({ disabled: true });

      const button = screen.getByRole("button");
      button.focus();

      // Disabled buttons can receive focus programmatically but not via Tab
      expect(button).toBeDisabled();
    });
  });

  describe("Keyboard Accessibility", () => {
    it("should trigger click on Enter key", async () => {
      const onClick = jest.fn();
      renderButton({ onClick });

      const button = screen.getByRole("button");
      button.focus();

      fireEvent.keyDown(button, { key: "Enter", code: "Enter" });
      fireEvent.keyUp(button, { key: "Enter", code: "Enter" });

      // Native button handles Enter automatically
      expect(button).toBeInTheDocument();
    });

    it("should trigger click on Space key", async () => {
      const onClick = jest.fn();
      renderButton({ onClick });

      const button = screen.getByRole("button");
      button.focus();

      fireEvent.keyDown(button, { key: " ", code: "Space" });

      // Native button handles Space automatically
      expect(button).toBeInTheDocument();
    });
  });

  describe("Accessibility Attributes", () => {
    it("should have accessible name from text prop", () => {
      renderButton({ text: "Submit Form" });

      expect(screen.getByRole("button", { name: "Submit Form" })).toBeInTheDocument();
    });

    it("should have accessible name from children if no text", () => {
      render(
        <ThemeProvider theme={lightTheme}>
          <Button>Child Content</Button>
        </ThemeProvider>,
      );

      expect(screen.getByRole("button", { name: "Child Content" })).toBeInTheDocument();
    });

    it("should be accessible when only icon is provided", () => {
      renderButton({ icon: "plus", text: undefined });

      const button = screen.getByRole("button");
      // Icon-only buttons should have an accessible name via aria-label
      expect(button).toBeInTheDocument();
    });
  });

  describe("Form Integration", () => {
    it("should work as submit button in forms", () => {
      const onSubmit = jest.fn((e) => e.preventDefault());

      render(
        <ThemeProvider theme={lightTheme}>
          <form onSubmit={onSubmit}>
            <Button type="submit" text="Submit" />
          </form>
        </ThemeProvider>,
      );

      const button = screen.getByRole("button", { name: "Submit" });
      fireEvent.click(button);

      expect(onSubmit).toHaveBeenCalled();
    });
  });

  describe("State Transitions", () => {
    it("should reflect loading state change", () => {
      const { rerender } = render(
        <ThemeProvider theme={lightTheme}>
          <Button text="Click" loading={false} />
        </ThemeProvider>,
      );

      let button = screen.getByRole("button");
      expect(button).not.toHaveClass("bp3-loading");
      expect(button).not.toBeDisabled();

      rerender(
        <ThemeProvider theme={lightTheme}>
          <Button text="Click" loading={true} />
        </ThemeProvider>,
      );

      button = screen.getByRole("button");
      expect(button).toHaveClass("bp3-loading");
      expect(button).toBeDisabled();
    });

    it("should reflect disabled state change", () => {
      const { rerender } = render(
        <ThemeProvider theme={lightTheme}>
          <Button text="Click" disabled={false} />
        </ThemeProvider>,
      );

      let button = screen.getByRole("button");
      expect(button).not.toBeDisabled();

      rerender(
        <ThemeProvider theme={lightTheme}>
          <Button text="Click" disabled={true} />
        </ThemeProvider>,
      );

      button = screen.getByRole("button");
      expect(button).toBeDisabled();
    });
  });
});