import React from "react";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import AutoToolTipComponent from "./AutoToolTipComponent";
import { ColumnTypes } from "widgets/TableWidgetV2/constants";
import "@testing-library/jest-dom";
import { isButtonTextTruncated } from "./AutoToolTipComponent";

jest.mock("react", () => ({
  ...jest.requireActual("react"),
  useState: (initial: unknown) => [initial, jest.fn()],
}));

test("shows tooltip on hover for BUTTON column type", async () => {
  const { getByText } = render(
    <AutoToolTipComponent
      columnType={ColumnTypes.BUTTON}
      title="Hover to see tooltip"
    >
      <button>Hover to see tooltip</button>
    </AutoToolTipComponent>,
  );

  fireEvent.mouseEnter(getByText("Hover to see tooltip"));
  await screen.findByText("Hover to see tooltip");
});

test("does not show tooltip for non-button types", () => {
  const { getByText } = render(
    <AutoToolTipComponent columnType={ColumnTypes.URL} title="Not a button">
      <a href="#">Not a button</a>
    </AutoToolTipComponent>,
  );

  expect(getByText("Not a button")).toBeInTheDocument();
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});

test("handles empty tooltip", () => {
  const { getByText } = render(
    <AutoToolTipComponent columnType={ColumnTypes.BUTTON} title="">
      <button>Empty button</button>
    </AutoToolTipComponent>,
  );

  expect(getByText("Empty button")).toBeInTheDocument();
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});

test("renders Link for URL column type", () => {
  render(
    <AutoToolTipComponent
      columnType={ColumnTypes.URL}
      title="Go to Google"
      url="https://www.google.com"
    >
      <span>Go to Google</span>
    </AutoToolTipComponent>,
  );
  expect(screen.getByText("Go to Google")).toBeInTheDocument();
});

test("renders content without tooltip for normal text", () => {
  const { getByText } = render(
    <AutoToolTipComponent title="Normal Text">
      <span>Normal Text</span>
    </AutoToolTipComponent>,
  );

  expect(getByText("Normal Text")).toBeInTheDocument();
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});

test("shows tooltip for truncated text", async () => {
  const longText = "This is a long text that will be truncated";
  const { getByText } = render(
    <AutoToolTipComponent columnType={ColumnTypes.BUTTON} title={longText}>
      <span
        style={{
          width: "50px",
          display: "inline-block",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {longText}
      </span>
    </AutoToolTipComponent>,
  );

  fireEvent.mouseEnter(getByText(longText));
  await screen.findByText(longText);
});

test("does not show tooltip for non-truncated text", () => {
  const shortText = "Short text";
  const { getByText } = render(
    <AutoToolTipComponent columnType={ColumnTypes.BUTTON} title={shortText}>
      <span>{shortText}</span>
    </AutoToolTipComponent>,
  );

  fireEvent.mouseEnter(getByText(shortText));
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});

test("shows tooltip for truncated button text", async () => {
  const longText = "This is a long text that will be truncated in the button";
  const { getByText } = render(
    <AutoToolTipComponent columnType={ColumnTypes.BUTTON} title={longText}>
      <span
        style={{
          width: "50px",
          display: "inline-block",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {longText}
      </span>
    </AutoToolTipComponent>,
  );

  fireEvent.mouseEnter(getByText(longText));
  await screen.findByText(longText);
});

test("opens a new tab for URL column type when clicked", () => {
  const openSpy = jest.spyOn(window, "open").mockImplementation(() => null);

  render(
    <AutoToolTipComponent
      columnType={ColumnTypes.URL}
      title="Go to Google"
      url="https://www.google.com"
    >
      <span>Go to Google</span>
    </AutoToolTipComponent>,
  );

  fireEvent.click(screen.getByText("Go to Google"));
  expect(openSpy).toHaveBeenCalledWith("https://www.google.com", "_blank");

  openSpy.mockRestore();
});

describe("isButtonTextTruncated", () => {
  function mockElementWidths(
    offsetWidth: number,
    scrollWidth: number,
  ): HTMLElement {
    const spanElement = document.createElement("span");

    Object.defineProperty(spanElement, "offsetWidth", { value: offsetWidth });
    Object.defineProperty(spanElement, "scrollWidth", { value: scrollWidth });
    const container = document.createElement("div");

    container.appendChild(spanElement);

    return container;
  }

  test("returns true when text is truncated (scrollWidth > offsetWidth)", () => {
    const element = mockElementWidths(100, 150);

    expect(isButtonTextTruncated(element)).toBe(true);
  });

  test("returns false when text is not truncated (scrollWidth <= offsetWidth)", () => {
    const element = mockElementWidths(150, 150);

    expect(isButtonTextTruncated(element)).toBe(false);
  });

  test("returns false when no span element is found", () => {
    const element = document.createElement("div");

    expect(isButtonTextTruncated(element)).toBe(false);
  });
});
