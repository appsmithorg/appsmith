import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { Provider } from "react-redux";
import store from "store";
import { ThemeProvider } from "styled-components";
import { lightTheme } from "selectors/themeSelectors";
import InstallationWindow from "../InstallationWindow";
import { ReduxActionTypes } from "ce/constants/ReduxActionConstants";

export const fetchApplicationMockResponse = {
  responseMeta: {
    status: 200,
    success: true,
  },
  data: {
    application: {
      id: "605c435a91dea93f0eaf91b8",
      name: "My Application",
      slug: "my-application",
      workspaceId: "",
      evaluationVersion: 1,
      appIsExample: false,
      gitApplicationMetadata: undefined,
      applicationVersion: 2,
    },
    pages: [
      {
        id: "605c435a91dea93f0eaf91ba",
        name: "Page1",
        isDefault: true,
        slug: "page-1",
      },
      {
        id: "605c435a91dea93f0eaf91bc",
        name: "Page2",
        isDefault: false,
        slug: "page-2",
      },
    ],
    workspaceId: "",
  },
};

describe("Contains all UI tests for JS libraries", () => {
  it("Headers should exist", () => {
    render(
      <Provider store={store}>
        <ThemeProvider theme={lightTheme}>
          <InstallationWindow open />
        </ThemeProvider>
      </Provider>,
    );
    expect(screen.getByText("Add JS Libraries")).toBeDefined();
    expect(screen.getByText("RECOMMENDED LIBRARIES")).toBeDefined();
    expect(screen.getByTestId("library-url")).toBeDefined();
  });

  it("Validates URL", () => {
    render(
      <Provider store={store}>
        <ThemeProvider theme={lightTheme}>
          <InstallationWindow open />
        </ThemeProvider>
      </Provider>,
    );
    const input = screen.getByTestId("library-url");
    fireEvent.change(input, { target: { value: "https://valid.com" } });
    expect(screen.queryByText("Please enter a valid URL")).toBeNull();
    fireEvent.change(input, { target: { value: "23" } });
    expect(screen.queryByText("Please enter a valid URL")).toBeDefined();
  });

  it("Renders progress bar", () => {
    render(
      <Provider store={store}>
        <ThemeProvider theme={lightTheme}>
          <InstallationWindow open />
        </ThemeProvider>
      </Provider>,
    );
    store.dispatch({
      type: ReduxActionTypes.FETCH_APPLICATION_SUCCESS,
      payload: {
        ...fetchApplicationMockResponse.data.application,
        pages: fetchApplicationMockResponse.data.pages,
      },
    });
    const input = screen.getByTestId("library-url");
    fireEvent.change(input, {
      target: {
        value:
          "https://cdnjs.cloudflare.com/ajax/libs/dayjs/1.11.6/dayjs.min.js",
      },
    });
    const installButton = screen.getByTestId("install-library-btn");
    expect(installButton).toBeDefined();
    fireEvent.click(installButton);

    expect(
      screen.queryByText(
        `Installing library for ${fetchApplicationMockResponse.data.application.name}`,
      ),
    ).toBeDefined();
  });
});
