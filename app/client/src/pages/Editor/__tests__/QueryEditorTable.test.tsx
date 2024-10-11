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
const reponsePaneHeight = 307;

const tableData = [
  { "": "Jan 1 1970 10:15AM" },
  { "": "Jan 2 1970 10:15AM" },
  { "": "Jan 3 1970 10:15AM" },
  { "": "Jan 4 1970 10:15AM" },
  { "": "Jan 5 1970 10:15AM" },
  { "": "Jan 1 1970 10:15AM" },
  { "": "Jan 2 1970 10:15AM" },
  { "": "Jan 3 1970 10:15AM" },
  { "": "Jan 4 1970 10:15AM" },
  { "": "Jan 5 1970 10:15AM" },
];

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

  it("17653: Scroll bar in table doesnt appear", () => {
    render(<Table data={tableData} tableBodyHeight={reponsePaneHeight} />);
    const tbodyEle = document.querySelectorAll(".tbody > div");

    expect(tbodyEle[0]).toHaveStyle("height: 171px");
  });
});
