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

  it("renders safe HTML tags like <code> as actual elements, not literal text", () => {
    const docWithCode =
      "Returns a number that can be used to clear the timeout with <code>clearTimeout()</code>.";
    const { container } = render(
      <TernDocToolTip completion={makeCompletion(docWithCode, "setTimeout")} />,
    );

    const codeElement = container.querySelector("code");

    expect(codeElement).not.toBeNull();
    expect(codeElement).toHaveTextContent("clearTimeout()");
    expect(container.querySelector("pre")?.textContent).not.toContain("<code>");
  });

  it("does NOT render img elements with onerror handlers", () => {
    const xssPayload = '<img src=x onerror="alert(1)">';
    const { container } = render(
      <TernDocToolTip completion={makeCompletion(xssPayload)} />,
    );

    expect(container.querySelector("img[onerror]")).toBeNull();
  });

  it("does NOT render script tags", () => {
    const xssPayload = '<script>alert("xss")</script>Safe text';
    const { container } = render(
      <TernDocToolTip completion={makeCompletion(xssPayload)} />,
    );

    expect(container.querySelectorAll("script")).toHaveLength(0);
    expect(container.querySelector("pre")).toHaveTextContent("Safe text");
  });

  it("returns null when doc is empty", () => {
    const { container } = render(
      <TernDocToolTip completion={makeCompletion("")} />,
    );

    expect(container.innerHTML).toBe("");
  });
});
