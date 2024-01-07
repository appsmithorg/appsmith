import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { Provider } from "react-redux";
import configureStore from "redux-mock-store";
import PackageEditorHeader from "./PackageEditorHeader";
import { updatePackage } from "@appsmith/actions/packageActions";
import { ExplorerPinnedState } from "@appsmith/reducers/uiReducers/explorerReducer";
import { BrowserRouter as Router } from "react-router-dom";
import "@testing-library/jest-dom";
import * as selectors from "@appsmith/selectors/packageSelectors";
import type { Package } from "@appsmith/constants/PackageConstants";

const currentPackage = {
  id: "pkg-1",
  name: "TestPackage1",
  icon: "package",
  modifiedBy: "user1",
  modifiedAt: "2021-08-10T09:00:00.000Z",
  isDefault: false,
  color: "#FFFFFF",
  workspaceId: "workspace123",
  userPermissions: [],
} as unknown as Package;

const store = configureStore()({
  ui: {
    editor: {
      isSnipingMode: false,
    },
    explorer: {
      pinnedState: ExplorerPinnedState.PINNED,
    },
    globalSearch: {
      modalOpen: false,
    },
    workspaces: {
      isSavingPkgName: false,
      isErrorSavingPkgName: false,
      currentWorkspace: {
        id: "workspace123",
      },
    },
  },
  entities: {
    pageList: {
      applicationId: "",
    },
    packages: {
      packagesList: [
        {
          id: "pkg-1",
          name: "TestPackage1",
        },
        {
          id: "pkg-2",
          name: "TestPackage2",
        },
      ],
      previewMode: false,
      currentPackageId: "123",
      workspaceId: "workspace123",
    },
  },
});

jest.spyOn(selectors, "getCurrentPackage").mockReturnValue(currentPackage);

const renderComponent = () => {
  return render(
    <Provider store={store}>
      <Router>
        <PackageEditorHeader />
      </Router>
    </Provider>,
  );
};

describe("PackageEditorHeader", () => {
  it("renders the PackageEditorHeader component", () => {
    renderComponent();

    // Assert that the component or key elements are in the document
    expect(
      screen.getByTestId("t--appsmith-package-editor-header"),
    ).toBeInTheDocument();
    expect(screen.getByTestId("t--package-publish-btn")).toBeInTheDocument();
  });

  it("calls updatePackage when package name is edited", () => {
    // Mock the updatePackage action
    store.dispatch = jest.fn();

    renderComponent();

    // Simulate editing the package name
    const packageName = screen.getByTestId("t--editor-menu-cta");
    fireEvent.click(packageName);
    const editNameMenuItem = screen.getByTestId("t--editor-menu-rename");
    fireEvent.click(editNameMenuItem);
    const packageNameInput = document.getElementsByClassName(
      "bp3-editable-text-input",
    )?.[0] as HTMLElement;
    fireEvent.change(packageNameInput, { target: { value: "NewPackageName" } });
    fireEvent.blur(packageNameInput);

    // Assert that the updatePackage action was called with the updated name
    expect(store.dispatch).toHaveBeenCalledWith(
      updatePackage({
        name: "NewPackageName",
        id: currentPackage.id,
      }),
    );
  });
});
