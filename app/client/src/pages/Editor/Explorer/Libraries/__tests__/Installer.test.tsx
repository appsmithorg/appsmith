import React from "react";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/extend-expect";
import { Provider } from "react-redux";
import store from "store";
import { ThemeProvider } from "styled-components";
import { lightTheme } from "selectors/themeSelectors";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import { Installer } from "pages/Editor/Explorer/Libraries/Installer";

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
  store.dispatch({
    type: ReduxActionTypes.TOGGLE_INSTALLER,
    payload: true,
  });
  afterEach(cleanup);

  it("Headers should exist", () => {
    render(
      <Provider store={store}>
        <ThemeProvider theme={lightTheme}>
          <Installer left={250} />
        </ThemeProvider>
      </Provider>,
    );
    expect(screen.getByText("Add JS Libraries")).toBeDefined();
    expect(screen.getByText("Recommended Libraries")).toBeDefined();
    expect(screen.getByTestId("library-url")).toBeDefined();
    expect(screen.getByTestId("install-library-btn")).toBeDisabled();
  });

  it("Validates URL", () => {
    render(
      <Provider store={store}>
        <ThemeProvider theme={lightTheme}>
          <Installer left={250} />
        </ThemeProvider>
      </Provider>,
    );
    const input = screen.getByTestId("library-url");
    fireEvent.change(input, { target: { value: "https://valid.com/file.js" } });
    expect(screen.getByTestId("install-library-btn")).toBeEnabled();
    expect(screen.queryByText("Please enter a valid URL")).toBeNull();
    fireEvent.change(input, { target: { value: "23" } });
    expect(screen.queryByText("Please enter a valid URL")).toBeDefined();
    expect(screen.getByTestId("install-library-btn")).toBeDisabled();
  });

  it("Renders progress bar", () => {
    render(
      <Provider store={store}>
        <ThemeProvider theme={lightTheme}>
          <Installer left={250} />
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

  it("Progress bar should disappear once the installation succeeds or fails", () => {
    render(
      <Provider store={store}>
        <ThemeProvider theme={lightTheme}>
          <Installer left={250} />
        </ThemeProvider>
      </Provider>,
    );
    store.dispatch({
      type: ReduxActionTypes.INSTALL_LIBRARY_INIT,
      payload:
        "https://cdnjs.cloudflare.com/ajax/libs/dayjs/1.11.6/dayjs.min.js",
    });

    expect(
      screen.queryByText(
        `Installing library for ${fetchApplicationMockResponse.data.application.name}`,
      ),
    ).toBeDefined();

    store.dispatch({
      type: ReduxActionTypes.INSTALL_LIBRARY_SUCCESS,
      payload: {
        name: "dayjs",
        version: "1.11.6",
        accessor: ["dayjs"],
        url: "https://cdnjs.cloudflare.com/ajax/libs/dayjs/1.11.6/dayjs.min.js",
      },
    });

    expect(
      screen.queryByText(
        `Installing library for ${fetchApplicationMockResponse.data.application.name}`,
      ),
    ).toBeNull();
  });
});
