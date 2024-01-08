import React from "react";
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import configureStore from "redux-mock-store";
import { Provider } from "react-redux";
import StartWithTemplateFilters from "./index";
import { ThemeProvider } from "styled-components";
import { lightTheme } from "selectors/themeSelectors";

const mockStore = configureStore([]);

const mockTemplate = {
  id: "mockid",
  userPermissions: ["read", "write"],
  title: "mock titile",
  description: "mock description",
  appUrl: "https://mockapp.com",
  gifUrl: "https://mockapp.com/mock.gif",
  screenshotUrls: [
    "https://mockapp.com/screenshot1.jpg",
    "https://mockapp.com/screenshot2.jpg",
  ],
  widgets: [],
  functions: ["Function1", "Function2"],
  useCases: ["UseCase1", "UseCase2"],
  datasources: ["Datasource1", "Datasource2"],
  pages: [],
  allowPageImport: true,
};

describe("<StartWithTemplateFilters />", () => {
  let store: any;

  beforeEach(() => {
    store = mockStore({
      ui: {
        applications: {
          isFetchingApplications: false,
        },
        templates: {
          filters: {
            functions: ["All"],
          },
          allFilters: {
            functions: [],
          },
          templateSearchQuery: "",
          templates: [mockTemplate],
        },
      },
    });
  });

  it("renders StartWithTemplateFilters component correctly", () => {
    render(
      <Provider store={store}>
        <ThemeProvider theme={lightTheme}>
          <StartWithTemplateFilters />
        </ThemeProvider>
      </Provider>,
    );

    expect(
      screen.getByTestId("t--application-search-input"),
    ).toBeInTheDocument();
  });
});
