import React from "react";
import { render, fireEvent, screen } from "@testing-library/react";
import CopyEntityToAppModal from "./CopyEntityToAppModal";
import { fetchPagesForCopyTarget } from "actions/copyToAppActions";

const mockDispatch = jest.fn();

jest.mock("react-redux", () => ({
  useDispatch: () => mockDispatch,
  // Selectors below are mocked to ignore state, so call them with no args.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  useSelector: (selector: any) => selector(),
}));

const applications = [
  { id: "source-app", name: "Source App", pages: [], userPermissions: [] },
  { id: "other-app", name: "Other App", pages: [], userPermissions: [] },
];

jest.mock("selectors/copyToAppSelectors", () => ({
  getIsCopyToAppModalOpen: () => true,
  getCopyToAppModalEntity: () => ({
    entityType: "ACTION",
    entityId: "a1",
    entityName: "Query1",
    sourcePageId: "p1",
  }),
  getCopyTargetApplications: () => applications,
  getCopyTargetPages: () => [],
  getIsCopyingEntityToApp: () => false,
  getIsFetchingCopyTargetApplications: () => false,
  getIsFetchingCopyTargetPages: () => false,
}));

jest.mock("ee/selectors/workspaceSelectors", () => ({
  getFetchedWorkspaces: () => [
    { id: "ws1", name: "Workspace 1", userPermissions: [] },
  ],
}));

jest.mock("selectors/editorSelectors", () => ({
  getCurrentApplicationId: () => "source-app",
}));

jest.mock("ee/utils/permissionHelpers", () => ({
  hasCreateNewAppPermission: () => true,
  hasManagePagePermission: () => true,
  isPermitted: () => true,
  PERMISSION_TYPE: { MANAGE_APPLICATION: "manage:applications" },
}));

// Open the application dropdown after selecting the workspace, so rc-select
// renders the (lazily-rendered) application options.
function openApplicationOptions() {
  fireEvent.mouseDown(screen.getByRole("combobox", { name: "Workspace" }));
  fireEvent.click(screen.getByText("Workspace 1"));
  fireEvent.mouseDown(screen.getByRole("combobox", { name: "Application" }));
}

describe("CopyEntityToAppModal", () => {
  beforeEach(() => mockDispatch.mockClear());

  it("excludes the source application from the target application list", () => {
    render(<CopyEntityToAppModal />);
    openApplicationOptions();

    // The source app the entity is copied FROM must not be a target option.
    expect(screen.queryByText("Source App")).toBeNull();
    expect(screen.getAllByText("Other App").length).toBeGreaterThan(0);
  });

  it("fetches the target application's pages when an application is selected", () => {
    render(<CopyEntityToAppModal />);
    openApplicationOptions();

    fireEvent.click(screen.getByText("Other App"));

    expect(mockDispatch).toHaveBeenCalledWith(
      fetchPagesForCopyTarget("other-app"),
    );
  });
});
