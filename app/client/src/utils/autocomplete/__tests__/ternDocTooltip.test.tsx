import React from "react";
import { render } from "@testing-library/react";
import "@testing-library/jest-dom";
import { TernDocToolTip } from "../ternDocTooltip";

jest.mock("ee/utils/autocomplete/EntityDefinitions", () => ({
  ternDocsInfo: {},
}));

jest.mock("@appsmith/ads", () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Link: ({ children, to, ...props }: Record<string, any>) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
}));

function makeCompletion(doc: string, displayText = "testFn") {
  return {
    data: { doc, url: "" },
    displayText,
  } as unknown as Parameters<typeof TernDocToolTip>[0]["completion"];
}

describe("TernDocToolTip", () => {
  it("renders doc text correctly for normal content", () => {
    const { container } = render(
      <TernDocToolTip completion={makeCompletion("Returns a number")} />,
    );

    expect(container.querySelector("pre")).toHaveTextContent(
      "Returns a number",
    );
  });

  it("does NOT render XSS payload as executable HTML element", () => {
    const xssPayload = '<img src=x onerror="alert(1)">';
    const { container } = render(
      <TernDocToolTip completion={makeCompletion(xssPayload)} />,
    );

    const imgElements = container.querySelectorAll("img");

    expect(imgElements).toHaveLength(0);
  });

  it("returns null when doc is empty", () => {
    const { container } = render(
      <TernDocToolTip completion={makeCompletion("")} />,
    );

    expect(container.innerHTML).toBe("");
  });
});
