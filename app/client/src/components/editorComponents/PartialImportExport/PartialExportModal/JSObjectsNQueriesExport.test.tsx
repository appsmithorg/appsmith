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

describe("<JSObjectsNQueriesExport /> Select All", () => {
  const selectAllTestId = "t--partial-export-modal-queries-select-all";
  const allQueryIds = Object.values(mockDataBaseProps).flatMap((items) =>
    items.map((item) => item.entity.id),
  );

  it("selects queries from every datasource group", () => {
    const updateSelectedQueries = jest.fn();

    render(
      <ThemeProvider theme={lightTheme}>
        <JSObjectsNQueriesExport
          {...baseProps}
          updateSelectedQueries={updateSelectedQueries}
        />
      </ThemeProvider>,
    );
    expect(allQueryIds.length).toBeGreaterThan(1);
    expect(screen.getByTestId(selectAllTestId)).not.toBeChecked();
    fireEvent.click(screen.getByTestId(selectAllTestId));
    expect(updateSelectedQueries).toHaveBeenCalledWith(allQueryIds);
  });

  it("clears every query when unticked", () => {
    const updateSelectedQueries = jest.fn();

    render(
      <ThemeProvider theme={lightTheme}>
        <JSObjectsNQueriesExport
          {...baseProps}
          selectedQueries={allQueryIds}
          updateSelectedQueries={updateSelectedQueries}
        />
      </ThemeProvider>,
    );
    expect(screen.getByTestId(selectAllTestId)).toBeChecked();
    fireEvent.click(screen.getByTestId(selectAllTestId));
    expect(updateSelectedQueries).toHaveBeenCalledWith([]);
  });

  it("does not render Select All when there are no queries", () => {
    render(
      <ThemeProvider theme={lightTheme}>
        <JSObjectsNQueriesExport {...baseProps} data={{}} />
      </ThemeProvider>,
    );
    expect(screen.queryByTestId(selectAllTestId)).not.toBeInTheDocument();
  });
});
