import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { Provider } from "react-redux";
import { BrowserRouter } from "react-router-dom";
import PackageDefaultState from "./PackageDefaultState";
import {
  getCurrentPackage,
  getFirstModule,
} from "@appsmith/selectors/packageSelectors";
import store from "store";
import urlBuilder from "@appsmith/entities/URLRedirect/URLAssembly";
import { getModuleById } from "@appsmith/selectors/modulesSelector";

jest.mock("@appsmith/selectors/packageSelectors");

jest.mock("react-router", () => ({
  ...jest.requireActual("react-router"),
  Redirect: ({ to }: any) => <p>Redirecting to - {to}</p>,
}));

const DEFAULT_MODULE = {
  id: "some-module-id",
  name: "JSModule1",
  type: "JS_MODULE",
  packageId: "654e24ca55aba27c364e5a32",
  inputsForm: [
    {
      id: "pjdquuvhxf",
      sectionName: "",
      children: [],
    },
  ],
  userPermissions: [
    "read:modules",
    "create:moduleExecutables",
    "create:moduleInstances",
    "manage:modules",
    "delete:modules",
  ],
  settingsForm: [],
};

jest.mock("@appsmith/selectors/modulesSelector");

describe("PackageDefaultState", () => {
  urlBuilder.setPackageParams({ packageId: "test-package" });

  it("renders the component with a New Module button", () => {
    (getCurrentPackage as unknown as jest.Mock).mockReturnValue({
      userPermissions: ["create:modules"],
    });
    (getFirstModule as jest.Mock).mockReturnValue(null);

    render(
      <Provider store={store}>
        <BrowserRouter>
          <PackageDefaultState />
        </BrowserRouter>
      </Provider>,
    );

    // Check that the New module button is rendered
    expect(screen.getByText("New Module")).toBeInTheDocument();
  });

  it("redirects to the last visited module when lastVisitedModuleId is provided", () => {
    (getCurrentPackage as unknown as jest.Mock).mockReturnValue({
      userPermissions: ["create:modules"],
    });
    (getModuleById as jest.Mock).mockReturnValue(DEFAULT_MODULE);

    render(
      <Provider store={store}>
        <BrowserRouter>
          <PackageDefaultState lastVisitedModuleId="some-module-id" />
        </BrowserRouter>
      </Provider>,
    );

    // Check that it redirects to the correct URL
    expect(screen.queryByText("New Module")).not.toBeInTheDocument();
    expect(
      screen.getByText(
        "Redirecting to - /pkg/test-package/some-module-id/edit",
      ),
    ).toBeInTheDocument();
  });

  it("redirects to the first module when there are no modules and permissions allow module creation", () => {
    (getCurrentPackage as unknown as jest.Mock).mockReturnValue({
      userPermissions: ["create:modules"],
    });
    (getModuleById as jest.Mock).mockReturnValue(undefined);
    (getFirstModule as jest.Mock).mockReturnValue({ id: "first-module-id" });

    render(
      <Provider store={store}>
        <BrowserRouter>
          <PackageDefaultState />
        </BrowserRouter>
      </Provider>,
    );

    // Check that it redirects to the correct URL
    expect(screen.queryByText("New Module")).not.toBeInTheDocument();
    expect(
      screen.getByText(
        "Redirecting to - /pkg/test-package/first-module-id/edit",
      ),
    ).toBeInTheDocument();
  });

  it("redirects to the lastVisitedModuleId by taking precedence over first module", () => {
    (getCurrentPackage as unknown as jest.Mock).mockReturnValue({
      userPermissions: ["create:modules"],
    });
    (getModuleById as jest.Mock).mockReturnValue(DEFAULT_MODULE);
    (getFirstModule as jest.Mock).mockReturnValue({ id: "first-module-id" });

    render(
      <Provider store={store}>
        <BrowserRouter>
          <PackageDefaultState lastVisitedModuleId="some-module-id" />
        </BrowserRouter>
      </Provider>,
    );

    // Check that it redirects to the correct URL
    expect(screen.queryByText("New Module")).not.toBeInTheDocument();
    expect(
      screen.getByText(
        "Redirecting to - /pkg/test-package/some-module-id/edit",
      ),
    ).toBeInTheDocument();
  });

  it("renders the component without a New Module button when user does not have permission", () => {
    (getCurrentPackage as unknown as jest.Mock).mockReturnValue({
      userPermissions: [],
    });
    (getFirstModule as jest.Mock).mockReturnValue(null);

    render(
      <Provider store={store}>
        <BrowserRouter>
          <PackageDefaultState />
        </BrowserRouter>
      </Provider>,
    );

    // Check that the New Module button is not rendered
    expect(screen.queryByText("New Module")).not.toBeInTheDocument();
  });
});
