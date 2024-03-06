import React from "react";
import { render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import { ThemeProvider } from "styled-components";
import "@testing-library/jest-dom";

import store from "store";
import {
  EMPTY_PACKAGE_LIST,
  createMessage,
} from "@appsmith/constants/messages";
import { lightTheme } from "selectors/themeSelectors";
import type { Package } from "@appsmith/constants/PackageConstants";
import PackageCardListRenderer from "./PackageCardListRenderer";

jest.mock("@appsmith/selectors/moduleFeatureSelectors");
jest.mock("@appsmith/selectors/packageSelectors");

jest.mock("@appsmith/pages/Applications", () => ({
  NoAppsFound: ({ children }: any) => <div>{children}</div>,
}));

const DEFAULT_PACKAGE_LIST = [
  {
    id: "a1",
    name: "Package 1",
    workspaceId: "64f16c08c8047557ed2a7f5b",
    modifiedAt: "2023-05-09T10:22:08.010Z",
    modifiedBy: "ashit@appsmiht.com",
  },
  {
    id: "a2",
    name: "Package 2",
    workspaceId: "64f16c08c8047557ed2a7f5b",
    modifiedAt: "2023-05-09T10:22:08.010Z",
    modifiedBy: "ashit@appsmiht.com",
  },
  {
    id: "a3",
    name: "Package 3",
    workspaceId: "64f16c08c8047557ed2a7f5b",
    modifiedAt: "2023-05-09T10:22:08.010Z",
    modifiedBy: "ashit@appsmiht.com",
  },
] as Package[];

describe("PackageCardList", () => {
  it("should show list of packages", () => {
    const { container } = render(
      <ThemeProvider theme={lightTheme}>
        <Provider store={store}>
          <PackageCardListRenderer
            createPackage={jest.fn()}
            isMobile={false}
            packages={DEFAULT_PACKAGE_LIST}
            workspaceId="test"
          />
        </Provider>
      </ThemeProvider>,
    );

    const cards = container.getElementsByClassName("t--package-card");

    expect(cards.length).toEqual(DEFAULT_PACKAGE_LIST.length);
  });

  it("should show empty package message when no packages are provided", async () => {
    const packages = [] as Package[];

    const { container } = render(
      <ThemeProvider theme={lightTheme}>
        <Provider store={store}>
          <PackageCardListRenderer
            createPackage={jest.fn()}
            isMobile={false}
            packages={packages}
            workspaceId="test"
          />
        </Provider>
      </ThemeProvider>,
    );

    const cards = container.getElementsByClassName("t--package-card");

    expect(cards.length).toEqual(packages.length);
    expect(
      await screen.findByText(createMessage(EMPTY_PACKAGE_LIST)),
    ).toBeVisible();
  });
});
