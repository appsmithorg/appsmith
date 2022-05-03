import SegmentHeader from "./ListSegmentHeader";
import { render, screen } from "test/testUtils";
import React from "react";

describe("ListSegmentHeader", () => {
  it("renders properly with hr element", async () => {
    render(<SegmentHeader title={"uh title"} />);
    const header = await screen.queryByTestId("t--styled-segment-header");
    expect(header).not.toBe(null);
    const hr = await screen.queryByTestId("t--styled-segment-header-hr");
    expect(hr).not.toBe(null);
    expect(header?.innerHTML.includes("uh title")).toBeTruthy();
  });
  it("renders properly without hr element", async () => {
    render(<SegmentHeader hideStyledHr title={"tvo title"} />);
    const header = await screen.queryByTestId("t--styled-segment-header");
    expect(header).not.toBe(null);
    const hr = await screen.queryByTestId("t--styled-segment-header-hr");
    expect(hr).toBe(null);
    expect(header?.innerHTML.includes("tvo title")).toBeTruthy();
  });
});
