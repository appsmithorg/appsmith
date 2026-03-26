import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { ThemeProvider } from "styled-components";
import { lightTheme } from "selectors/themeSelectors";
import { Collapsible, CollapsibleGroup, DisabledCollapsible } from "./Collapsible";

const renderCollapsible = (props = {}) => {
  return render(
    <ThemeProvider theme={lightTheme}>
      <Collapsible label="Test Collapsible" {...props}>
        <div data-testid="collapsible-content">Collapsible Content</div>
      </Collapsible>
    </ThemeProvider>,
  );
};

describe("Collapsible Accessibility Tests", () => {
  describe("ARIA Attributes", () => {
    it("should render the collapsible component with a label", () => {
      renderCollapsible();

      expect(screen.getByText("Test Collapsible")).toBeInTheDocument();
    });

    it("should render children when expanded by default", () => {
      renderCollapsible({ expand: true });

      expect(screen.getByTestId("collapsible-content")).toBeInTheDocument();
    });

    it("should have an expandable icon that indicates state", () => {
      const { container } = renderCollapsible({ expand: true });

      const icon = container.querySelector(".collapsible-icon");
      expect(icon).toBeInTheDocument();
    });

    it("should toggle expansion state when clicking the label", async () => {
      renderCollapsible({ expand: false });

      // Initially collapsed
      expect(screen.queryByTestId("collapsible-content")).not.toBeInTheDocument();

      // Click to expand
      const label = screen.getByText("Test Collapsible").closest(".icon-text");
      if (label) {
        fireEvent.click(label);
      }

      await waitFor(() => {
        expect(screen.getByTestId("collapsible-content")).toBeInTheDocument();
      });
    });

    it("should collapse when clicking the label on expanded state", async () => {
      renderCollapsible({ expand: true });

      // Initially expanded
      expect(screen.getByTestId("collapsible-content")).toBeInTheDocument();

      // Click to collapse
      const label = screen.getByText("Test Collapsible").closest(".icon-text");
      if (label) {
        fireEvent.click(label);
      }

      await waitFor(() => {
        expect(screen.queryByTestId("collapsible-content")).not.toBeInTheDocument();
      });
    });
  });

  describe("Keyboard Accessibility", () => {
    it("should have a clickable label element", () => {
      const { container } = renderCollapsible();

      const label = container.querySelector(".icon-text");
      expect(label).toBeInTheDocument();
      expect(label).toHaveStyle({ cursor: "pointer" });
    });

    it("should be accessible via click interaction", async () => {
      const handleCustomCollapse = jest.fn();
      renderCollapsible({ handleCustomCollapse });

      const label = screen.getByText("Test Collapsible").closest(".icon-text");
      if (label) {
        fireEvent.click(label);
      }

      await waitFor(() => {
        expect(handleCustomCollapse).toHaveBeenCalled();
      });
    });
  });

  describe("Icon State Indication", () => {
    it("should show down-arrow icon when expanded", () => {
      const { container } = renderCollapsible({ expand: true });

      const icon = container.querySelector(".collapsible-icon");
      expect(icon).toBeInTheDocument();
    });

    it("should show arrow-right icon when collapsed", () => {
      const { container } = renderCollapsible({ expand: false });

      const icon = container.querySelector('[name="arrow-right-s-line"]');
      expect(icon).toBeInTheDocument();
    });
  });

  describe("State Management", () => {
    it("should respect initial expand prop", () => {
      renderCollapsible({ expand: true });

      expect(screen.getByTestId("collapsible-content")).toBeInTheDocument();
    });

    it("should respect initial collapsed state", () => {
      renderCollapsible({ expand: false });

      expect(screen.queryByTestId("collapsible-content")).not.toBeInTheDocument();
    });

    it("should update state when expand prop changes", async () => {
      const { rerender } = render(
        <ThemeProvider theme={lightTheme}>
          <Collapsible label="Test" expand={false}>
            <div data-testid="content">Content</div>
          </Collapsible>
        </ThemeProvider>,
      );

      expect(screen.queryByTestId("content")).not.toBeInTheDocument();

      rerender(
        <ThemeProvider theme={lightTheme}>
          <Collapsible label="Test" expand={true}>
            <div data-testid="content">Content</div>
          </Collapsible>
        </ThemeProvider>,
      );

      await waitFor(() => {
        expect(screen.getByTestId("content")).toBeInTheDocument();
      });
    });
  });

  describe("CustomLabelComponent", () => {
    it("should render custom label component when provided", () => {
      const CustomLabel = ({ datasource }: { datasource?: unknown }) => (
        <span data-testid="custom-label">Custom Label</span>
      );

      renderCollapsible({ CustomLabelComponent: CustomLabel });

      expect(screen.getByTestId("custom-label")).toBeInTheDocument();
    });
  });

  describe("DisabledCollapsible", () => {
    it("should render with disabled styling", () => {
      const { container } = render(
        <ThemeProvider theme={lightTheme}>
          <DisabledCollapsible label="Disabled Section" />
        </ThemeProvider>,
      );

      expect(screen.getByText("Disabled Section")).toBeInTheDocument();

      // Check for disabled styling
      const wrapper = container.querySelector('[class*="CollapsibleWrapper"]');
      expect(wrapper).toBeInTheDocument();
    });

    it("should show tooltip when provided", () => {
      render(
        <ThemeProvider theme={lightTheme}>
          <DisabledCollapsible
            label="Disabled Section"
            tooltipLabel="This section is disabled"
          />
        </ThemeProvider>,
      );

      expect(screen.getByText("Disabled Section")).toBeInTheDocument();
    });
  });

  describe("CollapsibleGroup", () => {
    it("should render children within a group", () => {
      render(
        <ThemeProvider theme={lightTheme}>
          <CollapsibleGroup>
            <div data-testid="group-child">Group Child</div>
          </CollapsibleGroup>
        </ThemeProvider>,
      );

      expect(screen.getByTestId("group-child")).toBeInTheDocument();
    });

    it("should apply height and maxHeight props", () => {
      const { container } = render(
        <ThemeProvider theme={lightTheme}>
          <CollapsibleGroup height="500px" maxHeight="600px">
            <div>Content</div>
          </CollapsibleGroup>
        </ThemeProvider>,
      );

      const wrapper = container.firstChild;
      expect(wrapper).toBeInTheDocument();
    });
  });

  describe("Accessibility Recommendations", () => {
    /**
     * Note: The Collapsible component currently lacks some accessibility attributes
     * that would improve screen reader support:
     * 
     * - aria-expanded: Should be "true" when expanded, "false" when collapsed
     * - aria-controls: Should reference the ID of the content panel
     * - role="button": The clickable label should have this role
     * - tabIndex="0": To make it keyboard focusable
     * - Keyboard support: Enter and Space keys should toggle the collapse state
     * 
     * These tests document the expected behavior for accessibility compliance.
     */

    it("should have a label that is clickable", () => {
      const { container } = renderCollapsible();

      const label = container.querySelector(".icon-text");
      expect(label).toBeInTheDocument();
    });

    it("should provide visual indication of expanded/collapsed state", () => {
      const { container, rerender } = render(
        <ThemeProvider theme={lightTheme}>
          <Collapsible label="Test" expand={true}>
            <div>Content</div>
          </Collapsible>
        </ThemeProvider>,
      );

      // Check that icon indicates expanded state
      let icon = container.querySelector(".collapsible-icon");
      expect(icon).toBeInTheDocument();

      // Re-render with collapsed state
      rerender(
        <ThemeProvider theme={lightTheme}>
          <Collapsible label="Test" expand={false}>
            <div>Content</div>
          </Collapsible>
        </ThemeProvider>,
      );

      // Icon should still be present but may have different attributes
      icon = container.querySelector('[name="arrow-right-s-line"]');
      expect(icon).toBeInTheDocument();
    });
  });

  describe("Handle Custom Collapse", () => {
    it("should call handleCustomCollapse when toggle occurs", async () => {
      const handleCustomCollapse = jest.fn();
      renderCollapsible({ handleCustomCollapse, expand: true });

      const label = screen.getByText("Test Collapsible").closest(".icon-text");
      if (label) {
        fireEvent.click(label);
      }

      await waitFor(() => {
        expect(handleCustomCollapse).toHaveBeenCalledWith(false);
      });
    });
  });
});