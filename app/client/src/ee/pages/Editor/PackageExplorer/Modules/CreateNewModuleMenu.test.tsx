import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { Provider } from "react-redux";
import CreateNewModuleMenu from "./CreateNewModuleMenu";
import { getCurrentPackageId } from "@appsmith/selectors/packageSelectors";
import { createJSModule } from "@appsmith/actions/moduleActions";
import store from "store";
import { DatasourceCreateEntryPoints } from "constants/Datasource";

// Mock the selectors
jest.mock("@appsmith/selectors/packageSelectors");

const mockDispatch = jest.fn();
jest.mock("react-redux", () => ({
  ...jest.requireActual("react-redux"),
  useDispatch: () => mockDispatch,
}));

describe("CreateNewModuleMenu", () => {
  it("renders the component with passed trigger", () => {
    (getCurrentPackageId as jest.Mock).mockReturnValue("mockedPackageId");

    render(
      <Provider store={store}>
        <CreateNewModuleMenu
          canCreate
          closeMenu={() => {}}
          isOpen
          triggerElement={<div>Trigger Element</div>}
        />
      </Provider>,
    );

    // Check that the tooltip is rendered
    expect(screen.getByText("Trigger Element")).toBeInTheDocument();
  });

  it("renders menu items and handles click for JS Module", () => {
    (getCurrentPackageId as jest.Mock).mockReturnValue("mockedPackageId");

    render(
      <Provider store={store}>
        <CreateNewModuleMenu
          canCreate
          closeMenu={() => {}}
          isOpen
          triggerElement={<span>Trigger Element</span>}
        />
      </Provider>,
    );

    fireEvent.click(screen.getByTestId("t--add-module-menu-js-module"));

    expect(mockDispatch).toHaveBeenNthCalledWith(
      1,
      createJSModule({
        packageId: "mockedPackageId",
        from: DatasourceCreateEntryPoints.SUBMENU,
      }),
    );
  });
});
