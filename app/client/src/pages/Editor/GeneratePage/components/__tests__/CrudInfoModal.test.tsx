import React from "react";
import { render } from "@testing-library/react";
import "@testing-library/jest-dom";
import { InfoContent } from "../CrudInfoModal";

jest.mock("constants/ImagesURL", () => ({
  getInfoImage: () => "test-image.png",
  getInfoThumbnail: () => "test-thumb.png",
}));

jest.mock("ee/utils/airgapHelpers", () => ({
  getAssetUrl: (url: string) => url,
}));

describe("InfoContent - XSS prevention", () => {
  it("renders safe HTML content with bold tags", () => {
    const safeHtml =
      "We have generated the <b>Table</b> from the <b>PostgreSQL datasource</b>.";
    const { container } = render(
      <InfoContent successImageUrl="test.png" successMessage={safeHtml} />,
    );

    expect(container.querySelector("b")).toHaveTextContent("Table");
    expect(container).toHaveTextContent("PostgreSQL datasource");
  });

  it("does NOT render script tags from successMessage", () => {
    const xssPayload = '<script>alert("xss")</script><b>safe</b>';
    const { container } = render(
      <InfoContent successImageUrl="test.png" successMessage={xssPayload} />,
    );

    expect(container.querySelectorAll("script")).toHaveLength(0);
  });

  it("does NOT render img elements with onerror handlers", () => {
    const xssPayload = '<img src=x onerror="alert(1)"><b>safe</b>';
    const { container } = render(
      <InfoContent successImageUrl="test.png" successMessage={xssPayload} />,
    );

    expect(container.querySelector("img[onerror]")).toBeNull();
  });
});
