import React from "react";
import "@testing-library/jest-dom";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import configureStore from "redux-mock-store";
import { Provider } from "react-redux";
import { ThemeProvider } from "styled-components";

import TemplateFilters from "./index";
import { lightTheme } from "selectors/themeSelectors";
import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";
import {
  unitTestMockTemplate,
  unitTestMockTemplateAllFilters,
} from "../test_config";

const mockStore = configureStore([]);

describe("<TemplateFilters />", () => {
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let store: any;

  beforeEach(() => {
    store = mockStore({
      ui: {
        selectedWorkspace: {
          loadingStates: {
            isFetchingApplications: false,
          },
        },
        templates: {
          filters: {
            functions: ["All"],
          },
          allFilters: unitTestMockTemplateAllFilters,
          templateSearchQuery: "",
          templates: [unitTestMockTemplate],
        },
      },
    });
  });

  const BaseComponentRender = () => (
    <Provider store={store}>
      <ThemeProvider theme={lightTheme}>
        <TemplateFilters />
      </ThemeProvider>
    </Provider>
  );

  it("renders TemplateFilters component correctly", () => {
    render(<BaseComponentRender />);
    const filterItems = screen.getAllByTestId("t--templates-filter-item");

    expect(
      screen.getByTestId("t--application-search-input"),
    ).toBeInTheDocument();
    expect(filterItems.length).toBeGreaterThan(1);
  });

  it("sets the default filter to All when rendered", () => {
    render(<BaseComponentRender />);

    const expectedAction = {
      type: ReduxActionTypes.UPDATE_TEMPLATE_FILTERS,
      payload: {
        category: "functions",
        filterList: ["All"],
      },
    };

    expect(store.getActions()).toEqual(
      expect.arrayContaining([expectedAction]),
    );
  });

  it("removes 'All' filter when a filter item is selected", async () => {
    render(
      <Provider store={store}>
        <ThemeProvider theme={lightTheme}>
          <TemplateFilters />
        </ThemeProvider>
      </Provider>,
    );
    const filterItems = screen.getAllByTestId("t--templates-filter-item");

    fireEvent.click(filterItems[1]); // Click on the second filter item
    await waitFor(() => {
      expect(store.getActions()).toEqual(
        expect.arrayContaining([
          {
            type: ReduxActionTypes.UPDATE_TEMPLATE_FILTERS,
            payload: {
              category: "functions",
              filterList: expect.not.arrayContaining(["All"]),
            },
          },
        ]),
      );
    });
  });

  it("dispatches filterTemplates action on filter selection", async () => {
    render(<BaseComponentRender />);
    const firstFilterElement = screen.getAllByTestId(
      "t--templates-filter-item",
    )[1];

    fireEvent.click(firstFilterElement);
    // Wait for the debounced search input action to complete
    await waitFor(() => {
      const expectedAction = {
        type: ReduxActionTypes.UPDATE_TEMPLATE_FILTERS,
        payload: {
          category: "functions",
          filterList: ["Operations"],
        },
      };

      expect(store.getActions()).toEqual(
        expect.arrayContaining([expectedAction]),
      );
    });
  });

  it("dispatches setTemplateSearchQuery action on text input", async () => {
    render(<BaseComponentRender />);
    const searchInput = screen.getByTestId("t--application-search-input");

    fireEvent.change(searchInput, { target: { value: "test query" } });
    await waitFor(() => {
      expect(store.getActions()).toEqual(
        expect.arrayContaining([
          {
            type: ReduxActionTypes.SET_TEMPLATE_SEARCH_QUERY,
            payload: "test query",
          },
        ]),
      );
    });
  });

  it("dispatches filterTemplates action on multiple filter selection", async () => {
    render(<BaseComponentRender />);
    const filterItems = screen.getAllByTestId("t--templates-filter-item");

    fireEvent.click(filterItems[1]);
    fireEvent.click(filterItems[2]);
    await waitFor(() => {
      expect(store.getActions()).toEqual(
        expect.arrayContaining([
          {
            type: ReduxActionTypes.UPDATE_TEMPLATE_FILTERS,
            payload: {
              category: "functions",
              filterList: ["Operations"],
            },
          },
          {
            type: ReduxActionTypes.UPDATE_TEMPLATE_FILTERS,
            payload: {
              category: "functions",
              filterList: ["Communications"],
            },
          },
        ]),
      );
    });
  });
});
