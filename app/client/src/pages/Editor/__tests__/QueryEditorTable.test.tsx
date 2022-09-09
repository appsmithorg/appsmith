import React from "react";
import { render, screen } from "test/testUtils";
import "@testing-library/jest-dom";
import Table from "../QueryEditor/Table";
import { getScrollBarWidth } from "../QueryEditor/Table";

function createEle() {
  return {
    scrollHeight: 0,
    clientHeight: 0,
  };
}

const scrollW = 6;

describe("Query Editor Table", () => {
  it("it should render table with missing key", () => {
    render(<Table data={[{ "": "Jan 1 1970 10:15AM" }]} />);
    const date = screen.getByText(/Jan 1 1970 10:15AM/i);
    expect(date).toBeInTheDocument();
  });

  it("13406: it should return scroll bar width 0 when table element is not defined", () => {
    const ele = undefined;
    const scrollWidth = getScrollBarWidth(ele, scrollW);
    expect(scrollWidth).toBe(0);
  });

  it("13406: it should render table without scroll and scroll bar width would be 0", () => {
    const ele = createEle();
    ele.scrollHeight = 268;
    ele.clientHeight = 268;

    const scrollWidth = getScrollBarWidth(ele, scrollW);
    expect(scrollWidth).toBe(0);
  });

  it("13406: it should render table with scroll and scroll bar width would be greater than 0", () => {
    const ele = createEle();
    ele.scrollHeight = 368;
    ele.clientHeight = 268;

    const scrollWidth = getScrollBarWidth(ele, scrollW);
    expect(scrollWidth).toBeGreaterThan(0);
  });
});
