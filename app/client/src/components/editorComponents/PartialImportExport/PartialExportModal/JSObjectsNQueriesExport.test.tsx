import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import JSObjectsNQueriesExport from "./JSObjectsNQueriesExport";
import { lightTheme } from "selectors/themeSelectors";
import { mockAppDSProps, mockDataBaseProps } from "./unitTestUtils";
import { ThemeProvider } from "styled-components";

jest.mock("react-redux", () => {
  const originalModule = jest.requireActual("react-redux");

  return {
    ...originalModule,
    useDispatch: () => jest.fn(),
    useSelector: () => jest.fn(),
  };
});

const baseProps = {
  appDS: mockAppDSProps,
  data: mockDataBaseProps,
  selectedQueries: [],
  updateSelectedQueries: jest.fn(),
};

const BaseComponentRender = () => (
  <ThemeProvider theme={lightTheme}>
    <JSObjectsNQueriesExport {...baseProps} />
  </ThemeProvider>
);

describe("<JSObjectsNQueriesExport />", () => {
  it("renders the component with correct props", () => {
    render(<BaseComponentRender />);
    const moviesDatabase = screen.getByText("Movies");

    expect(moviesDatabase).toBeInTheDocument();
    const usersDatabase = screen.getByText("users");

    expect(usersDatabase).toBeInTheDocument();
    const moviesQuery = screen.getByText("Query1");

    expect(moviesQuery).toBeInTheDocument();
    const usersQuery = screen.getByText("getUsers");

    expect(usersQuery).toBeInTheDocument();
  });

  it("toggles the query list when datasource is clicked", () => {
    render(<BaseComponentRender />);
    const moviesDatasource = screen.getByText("Movies");

    fireEvent.click(moviesDatasource);
    expect(screen.getByText("Query1")).not.toBeVisible();
    fireEvent.click(moviesDatasource);
    expect(screen.getByText("Query1")).toBeVisible();
  });
});
