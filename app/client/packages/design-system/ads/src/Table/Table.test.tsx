import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom/extend-expect";
import { Table } from "./Table";

const columns = [
  {
    title: "Name",
    dataIndex: "name",
  },
  {
    title: "Age",
    dataIndex: "age",
  },
  {
    title: "Address",
    dataIndex: "address",
    render: (value: { city: string }) => `${value.city}`,
    sortBy: "city",
  },
];

const fakeData = [
  {
    key: "1",
    name: "Ash",
    age: 28,
    address: { city: "New York" },
  },
  {
    key: "2",
    name: "Jane",
    age: 22,
    address: { city: "Los Angeles" },
  },
  {
    key: "3",
    name: "Doe",
    age: 32,
    address: { city: "Chicago" },
  },
];

const ashRowText = `${fakeData[0].name}${fakeData[0].age}${fakeData[0].address.city}`;
const janeRowText = `${fakeData[1].name}${fakeData[1].age}${fakeData[1].address.city}`;
const doeRowText = `${fakeData[2].name}${fakeData[2].age}${fakeData[2].address.city}`;

describe("Table Component", () => {
  it("sorts table by name in ascending order", async () => {
    render(<Table columns={columns} data={fakeData} isSortable />);

    fireEvent.click(screen.getByText("Name"));

    const rows = screen.getAllByRole("row");

    expect(rows[1]).toHaveTextContent(ashRowText);
    expect(rows[2]).toHaveTextContent(doeRowText);
    expect(rows[3]).toHaveTextContent(janeRowText);
  });

  it("sorts table by name in descending order", async () => {
    render(<Table columns={columns} data={fakeData} isSortable />);

    fireEvent.click(screen.getByText("Name"));
    fireEvent.click(screen.getByText("Name"));

    const rows = screen.getAllByRole("row");

    expect(rows[1]).toHaveTextContent(janeRowText);
    expect(rows[2]).toHaveTextContent(doeRowText);
    expect(rows[3]).toHaveTextContent(ashRowText);
  });

  it("sorts table by age in ascending order", async () => {
    render(<Table columns={columns} data={fakeData} isSortable />);

    fireEvent.click(screen.getByText("Age"));

    const rows = screen.getAllByRole("row");

    expect(rows[1]).toHaveTextContent(janeRowText);
    expect(rows[2]).toHaveTextContent(ashRowText);
    expect(rows[3]).toHaveTextContent(doeRowText);
  });

  it("sorts table by age in descending order", async () => {
    render(<Table columns={columns} data={fakeData} isSortable />);

    fireEvent.click(screen.getByText("Age"));
    fireEvent.click(screen.getByText("Age"));

    const rows = screen.getAllByRole("row");

    expect(rows[1]).toHaveTextContent(doeRowText);
    expect(rows[2]).toHaveTextContent(ashRowText);
    expect(rows[3]).toHaveTextContent(janeRowText);
  });

  it("sorts table by city in ascending order", async () => {
    render(<Table columns={columns} data={fakeData} isSortable />);

    fireEvent.click(screen.getByText("Address"));

    const rows = screen.getAllByRole("row");

    expect(rows[1]).toHaveTextContent(doeRowText);
    expect(rows[2]).toHaveTextContent(janeRowText);
    expect(rows[3]).toHaveTextContent(ashRowText);
  });

  it("sorts table by city in descending order", async () => {
    render(<Table columns={columns} data={fakeData} isSortable />);

    fireEvent.click(screen.getByText("Address"));
    fireEvent.click(screen.getByText("Address"));

    const rows = screen.getAllByRole("row");

    expect(rows[1]).toHaveTextContent(ashRowText);
    expect(rows[2]).toHaveTextContent(janeRowText);
    expect(rows[3]).toHaveTextContent(doeRowText);
  });
});
