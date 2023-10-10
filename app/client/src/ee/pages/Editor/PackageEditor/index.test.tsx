import React from "react";
import Helmet from "react-helmet";
import { Provider } from "react-redux";
import { render } from "@testing-library/react";
import { BrowserRouter as Router } from "react-router-dom";

import store from "store";
import PackageEditor from ".";
import * as packageSelectors from "@appsmith/selectors/packageSelectors";
import type { Package } from "@appsmith/constants/PackageConstants";

jest.mock("@appsmith/selectors/packageSelectors");

const DEFAULT_PACKAGE = {
  id: "test",
  name: "Package 1",
} as Package;

describe("PackageEditor", () => {
  it("show the spinner as loader when the editor is not initialized", () => {
    jest
      .spyOn(packageSelectors, "getIsPackageEditorInitialized")
      .mockImplementation(() => false);
    jest
      .spyOn(packageSelectors, "getCurrentPackage")
      .mockImplementation(() => null);

    const { container } = render(
      <Provider store={store}>
        <PackageEditor />
      </Provider>,
    );

    const loadingSpinner = container.querySelector(".ads-v2-spinner");

    expect(loadingSpinner).not.toBeNull();
  });

  it("renders the package name as title when the editor is initialized", () => {
    jest
      .spyOn(packageSelectors, "getIsPackageEditorInitialized")
      .mockImplementation(() => true);
    jest
      .spyOn(packageSelectors, "getCurrentPackage")
      .mockImplementation(() => DEFAULT_PACKAGE);
    const { container } = render(
      <Provider store={store}>
        <Router>
          <PackageEditor />
        </Router>
      </Provider>,
    );

    const helmet = Helmet.peek();
    const loadingSpinner = container.querySelector(".ads-v2-spinner");

    expect(helmet.title.toString()).toEqual(
      `${DEFAULT_PACKAGE.name} | Editor | Appsmith`,
    );
    expect(loadingSpinner).toBeNull();
  });
});
