import "@testing-library/jest-dom/extend-expect";
import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { ThemeProvider } from "styled-components";
import { lightTheme } from "selectors/themeSelectors";

import type { CardComponentProps } from "./index";
import CardComponent from "./index";

const defaultProps: CardComponentProps = {
  widgetId: "card-widget-test",
  mediaPosition: "NONE",
  showHeader: true,
  title: "Card title",
  subtitle: "Card subtitle",
  badgeText: "Active",
  menuItems: [
    {
      id: "menuItem1",
      index: 0,
      widgetId: "",
      label: "First menu item",
      isVisible: true,
      onClick: "{{showAlert('menu')}}",
    },
  ],
  showFooter: true,
  footerActions: [
    {
      id: "footerAction1",
      index: 0,
      widgetId: "",
      label: "View",
      isVisible: true,
      onClick: "{{showAlert('view')}}",
    },
  ],
  isClickable: false,
  onFooterActionClick: jest.fn(),
  onMenuItemClick: jest.fn(),
  showHeaderDivider: true,
  showFooterDivider: true,
  hoverElevation: false,
  shouldScrollContents: false,
};

const renderCard = (props: Partial<CardComponentProps> = {}) =>
  render(
    <ThemeProvider theme={lightTheme}>
      <CardComponent {...defaultProps} {...props}>
        <div data-testid="t--card-body-canvas" />
      </CardComponent>
    </ThemeProvider>,
  );

describe("CardComponent", () => {
  it("renders header, body and footer zones", () => {
    renderCard();

    expect(screen.getByText("Card title")).toBeInTheDocument();
    expect(screen.getByText("Card subtitle")).toBeInTheDocument();
    expect(screen.getByText("Active")).toBeInTheDocument();
    expect(screen.getByTestId("t--card-body-canvas")).toBeInTheDocument();
    expect(screen.getByText("View")).toBeInTheDocument();
  });

  it("renders a semantic article element", () => {
    const { container } = renderCard();

    expect(container.querySelector("article")).not.toBeNull();
  });

  it("does not render the media zone when mediaPosition is NONE", () => {
    const { container } = renderCard({
      mediaImage: "https://example.com/image.png",
      mediaPosition: "NONE",
    });

    expect(container.querySelector('[data-card-zone="media"]')).toBeNull();
  });

  it("renders the media zone when mediaPosition is TOP and an image is set", () => {
    const { container } = renderCard({
      mediaImage: "https://example.com/image.png",
      mediaPosition: "TOP",
    });

    expect(container.querySelector('[data-card-zone="media"]')).not.toBeNull();
  });

  it("applies mediaAltText to the media image and defaults to empty alt", () => {
    const { container, rerender } = renderCard({
      mediaAltText: "Product photo",
      mediaImage: "https://example.com/image.png",
      mediaPosition: "TOP",
    });

    expect(
      container.querySelector('[data-card-zone="media"] img'),
    ).toHaveAttribute("alt", "Product photo");

    rerender(
      <ThemeProvider theme={lightTheme}>
        <CardComponent
          {...defaultProps}
          mediaImage="https://example.com/image.png"
          mediaPosition="TOP"
        >
          <div data-testid="t--card-body-canvas" />
        </CardComponent>
      </ThemeProvider>,
    );

    expect(
      container.querySelector('[data-card-zone="media"] img'),
    ).toHaveAttribute("alt", "");
  });

  it("hides header and footer when toggled off", () => {
    const { container } = renderCard({
      showFooter: false,
      showHeader: false,
    });

    expect(container.querySelector('[data-card-zone="header"]')).toBeNull();
    expect(container.querySelector('[data-card-zone="footer"]')).toBeNull();
  });

  it("adds button semantics when clickable and fires onCardClick on chrome clicks", () => {
    const onCardClick = jest.fn();
    const { container } = renderCard({
      isClickable: true,
      onCardClick,
    });

    const article = container.querySelector("article") as HTMLElement;

    expect(article).toHaveAttribute("role", "button");
    expect(article).toHaveAttribute("tabindex", "0");

    fireEvent.click(article);
    expect(onCardClick).toHaveBeenCalledTimes(1);

    fireEvent.keyDown(article, { key: "Enter" });
    expect(onCardClick).toHaveBeenCalledTimes(2);

    fireEvent.keyDown(article, { key: " " });
    expect(onCardClick).toHaveBeenCalledTimes(3);
  });

  it("does not fire onCardClick for clicks inside the body canvas", () => {
    const onCardClick = jest.fn();

    renderCard({
      isClickable: true,
      onCardClick,
    });

    fireEvent.click(screen.getByTestId("t--card-body-canvas"));
    expect(onCardClick).not.toHaveBeenCalled();
  });

  it("does not fire onCardClick for footer action clicks and calls the action handler instead", () => {
    const onCardClick = jest.fn();
    const onFooterActionClick = jest.fn();

    renderCard({
      isClickable: true,
      onCardClick,
      onFooterActionClick,
    });

    fireEvent.click(screen.getByText("View"));
    expect(onCardClick).not.toHaveBeenCalled();
    expect(onFooterActionClick).toHaveBeenCalledWith("{{showAlert('view')}}");
  });

  describe("overflow menu", () => {
    it("applies the configured text and background colors to menu items", async () => {
      renderCard({
        menuItems: [
          {
            id: "menuItem1",
            index: 0,
            widgetId: "",
            label: "Styled item",
            isVisible: true,
            textColor: "#ff0000",
            backgroundColor: "#00ff00",
          },
        ],
      });

      fireEvent.click(
        screen.getByRole("button", { name: "Card actions menu" }),
      );

      const menuItem = (await screen.findByText("Styled item")).closest(
        "a",
      ) as HTMLElement;

      expect(menuItem).toHaveStyle("color: #ff0000");

      // jsdom's getComputedStyle does not understand pseudo-class
      // selectors, so the :active darkened override would win in a
      // toHaveStyle assertion. Assert the base (non-pseudo) rule of the
      // styled menu item sets the configured background instead.
      const baseRuleBackgrounds = Array.from(document.styleSheets)
        .flatMap((sheet) => Array.from(sheet.cssRules))
        .filter(
          (rule): rule is CSSStyleRule =>
            "selectorText" in rule &&
            !(rule as CSSStyleRule).selectorText.includes(":") &&
            menuItem.matches((rule as CSSStyleRule).selectorText),
        )
        .map((rule) => rule.style.getPropertyValue("background-color"))
        .filter(Boolean);

      expect(
        baseRuleBackgrounds.some((value) =>
          ["#00ff00", "rgb(0, 255, 0)"].includes(value),
        ),
      ).toBe(true);
    });
  });

  describe("selection", () => {
    it("toggles selection on card click and takes precedence over onCardClick", () => {
      const onCardClick = jest.fn();
      const onToggleSelection = jest.fn();
      const { container } = renderCard({
        isClickable: true,
        onCardClick,
        onToggleSelection,
        selectionEnabled: true,
      });

      const article = container.querySelector("article") as HTMLElement;

      fireEvent.click(article);
      expect(onToggleSelection).toHaveBeenCalledTimes(1);
      expect(onCardClick).not.toHaveBeenCalled();
    });

    it("exposes the selected state via aria-pressed", () => {
      const { container } = renderCard({
        isSelected: true,
        selectionEnabled: true,
      });

      const article = container.querySelector("article") as HTMLElement;

      expect(article).toHaveAttribute("aria-pressed", "true");
      expect(article).toHaveAttribute("role", "button");
    });
  });

  describe("expand / collapse", () => {
    it("renders a chevron with aria-expanded and toggles on click", () => {
      const onToggleExpand = jest.fn();

      renderCard({
        expandCollapseEnabled: true,
        isExpanded: true,
        onToggleExpand,
      });

      const chevron = screen.getByTestId("t--card-expand-toggle");

      expect(chevron).toHaveAttribute("aria-expanded", "true");

      fireEvent.click(chevron);
      expect(onToggleExpand).toHaveBeenCalledTimes(1);
    });

    it("hides the body and footer when collapsed, keeping the header", () => {
      const { container } = renderCard({
        expandCollapseEnabled: true,
        isExpanded: false,
      });

      expect(container.querySelector('[data-card-zone="body"]')).toBeNull();
      expect(container.querySelector('[data-card-zone="footer"]')).toBeNull();
      expect(
        container.querySelector('[data-card-zone="header"]'),
      ).not.toBeNull();
      expect(screen.getByTestId("t--card-expand-toggle")).toHaveAttribute(
        "aria-expanded",
        "false",
      );
    });

    it("does not fire card activation for chevron clicks", () => {
      const onCardClick = jest.fn();

      renderCard({
        expandCollapseEnabled: true,
        isClickable: true,
        isExpanded: true,
        onCardClick,
      });

      fireEvent.click(screen.getByTestId("t--card-expand-toggle"));
      expect(onCardClick).not.toHaveBeenCalled();
    });

    it("treats an absent isExpanded prop as expanded", () => {
      const { container } = renderCard({
        expandCollapseEnabled: true,
      });

      expect(container.querySelector('[data-card-zone="body"]')).not.toBeNull();
      expect(screen.getByTestId("t--card-expand-toggle")).toHaveAttribute(
        "aria-expanded",
        "true",
      );
    });

    it("points the chevron's aria-controls at the body region id", () => {
      const { container } = renderCard({
        expandCollapseEnabled: true,
        isExpanded: true,
      });

      const body = container.querySelector('[data-card-zone="body"]');

      expect(body).toHaveAttribute("id", "card-body-card-widget-test");
      expect(screen.getByTestId("t--card-expand-toggle")).toHaveAttribute(
        "aria-controls",
        "card-body-card-widget-test",
      );
    });
  });

  describe("disabled", () => {
    it("blocks card activation and marks the card as aria-disabled", () => {
      const onCardClick = jest.fn();
      const onToggleSelection = jest.fn();
      const { container } = renderCard({
        isClickable: true,
        isDisabled: true,
        onCardClick,
        onToggleSelection,
        selectionEnabled: true,
      });

      const article = container.querySelector("article") as HTMLElement;

      expect(article).toHaveAttribute("aria-disabled", "true");
      expect(article).not.toHaveAttribute("role");

      fireEvent.click(article);
      fireEvent.keyDown(article, { key: "Enter" });
      expect(onCardClick).not.toHaveBeenCalled();
      expect(onToggleSelection).not.toHaveBeenCalled();
    });

    it("disables footer action buttons and the expand toggle", () => {
      renderCard({
        expandCollapseEnabled: true,
        isDisabled: true,
        isExpanded: true,
      });

      expect(screen.getByTestId("t--card-expand-toggle")).toBeDisabled();
      expect(
        screen.getByText("View").closest("button") as HTMLButtonElement,
      ).toBeDisabled();
    });
  });

  describe("loading skeleton", () => {
    it("applies the skeleton class to media, header and footer zones when loading", () => {
      const { container } = renderCard({
        isLoading: true,
        mediaImage: "https://example.com/image.png",
        mediaPosition: "TOP",
      });

      expect(container.querySelector('[data-card-zone="media"]')).toHaveClass(
        "bp3-skeleton",
      );
      expect(container.querySelector('[data-card-zone="header"]')).toHaveClass(
        "bp3-skeleton",
      );
      expect(container.querySelector('[data-card-zone="footer"]')).toHaveClass(
        "bp3-skeleton",
      );
    });

    it("does not apply the skeleton class when not loading", () => {
      const { container } = renderCard({
        mediaImage: "https://example.com/image.png",
        mediaPosition: "TOP",
      });

      expect(
        container.querySelector('[data-card-zone="header"]'),
      ).not.toHaveClass("bp3-skeleton");
    });
  });
});
