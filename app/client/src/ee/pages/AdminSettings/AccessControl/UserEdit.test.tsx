import React from "react";
import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "test/testUtils";
import { allUsers } from "./mocks/UserListingMock";
import { UserEdit } from "./UserEdit";
import * as selectors from "@appsmith/selectors/aclSelectors";
import { mockUserPermissions } from "./mocks/mockSelectors";
import { PERMISSION_TYPE } from "@appsmith/utils/permissionHelpers";
import userEvent from "@testing-library/user-event";
import { BaseGroupRoleProps } from "./types";

let container: any = null;

const onDeleteHandler = jest.fn();

const selectedUser = allUsers[0];

const props = {
  onDelete: onDeleteHandler,
  searchPlaceholder: "Search users",
  selectedUser,
  isLoading: false,
};

function renderComponent() {
  return render(<UserEdit {...props} />);
}

const toggleDefaultRoles = async () => {
  const toggleWrapper = screen.getByTestId("t--toggle-wrapper");
  const toggleInput = toggleWrapper.getElementsByTagName("input")[0];
  await fireEvent.click(toggleInput);
};

describe("<UserEdit />", () => {
  jest
    .spyOn(selectors, "getUserPermissions")
    .mockImplementation(mockUserPermissions as any);
  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
  });
  it("is rendered", () => {
    renderComponent();
    const userListing = screen.queryAllByTestId("t--user-edit-wrapper");
    expect(userListing).toHaveLength(1);
  });
  it("should render username and email properly", () => {
    renderComponent();
    const userInfo = screen.queryAllByTestId("t--user-edit-userInfo");
    expect(userInfo[0]).toHaveTextContent(selectedUser.username);
    expect(userInfo[0]).toHaveTextContent(selectedUser.name);
  });
  it("should display active and all roles properly with icons for default roles", () => {
    renderComponent();
    const tabs = screen.getAllByRole("tab");
    expect(tabs.length).toEqual(2);
    tabs[1].click();
    const activeRolesData = allUsers[0].roles;
    const allRolesData = allUsers[0].allRoles;
    const customRolesData = allUsers[0].allRoles.filter(
      (r: BaseGroupRoleProps) => !r.autoCreated,
    );

    // when default roles toggle is off
    const activeRoles = screen.queryAllByTestId("t--active-group-row");
    let allRoles = screen.queryAllByTestId("t--all-group-row");

    expect(activeRolesData.length).toEqual(activeRoles.length);
    expect(customRolesData.length).toEqual(allRoles.length);

    // when default roles toggle is on
    toggleDefaultRoles();
    allRoles = screen.queryAllByTestId("t--all-group-row");
    expect(allRolesData.length).toEqual(allRoles.length);

    activeRolesData.map((role: BaseGroupRoleProps, index: number) => {
      if (role.autoCreated) {
        expect(
          activeRoles[index].querySelectorAll(
            "[data-testid='t--default-role']",
          ),
        ).toHaveLength(1);
      } else {
        expect(
          activeRoles[index].querySelectorAll(
            "[data-testid='t--default-role']",
          ),
        ).toHaveLength(0);
      }
    });

    allRolesData.map((role: BaseGroupRoleProps, index: number) => {
      if (role.autoCreated) {
        expect(
          allRoles[index].querySelectorAll("[data-testid='t--default-role']"),
        ).toHaveLength(1);
      } else {
        expect(
          allRoles[index].querySelectorAll("[data-testid='t--default-role']"),
        ).toHaveLength(0);
      }
    });
  });
  it("should show delete option on click of more action icon", () => {
    const { getAllByTestId } = renderComponent();
    const moreMenu = getAllByTestId("actions-cell-menu-icon");
    fireEvent.click(moreMenu[0]);
    const menu = getAllByTestId("t--delete-menu-item");
    expect(menu).toHaveLength(1);
  });
  it("should show confirmation message when the delete user option is clicked", async () => {
    const { getAllByTestId } = renderComponent();
    const moreMenu = getAllByTestId("actions-cell-menu-icon");
    await userEvent.click(moreMenu[0]);
    const menu = getAllByTestId("t--delete-menu-item");
    expect(menu[0]).toHaveTextContent("Delete");
    expect(menu[0]).not.toHaveTextContent("Are you sure?");
    await userEvent.click(menu[0]);
    const confirmationText = getAllByTestId("t--delete-menu-item");
    expect(confirmationText[0]).toHaveTextContent("Are you sure?");
    await userEvent.dblClick(menu[0]);
    expect(props.onDelete).toHaveBeenCalledWith(selectedUser.id);
    expect(window.location.pathname).toEqual("/settings/users");
  });
  it("should contain two tabs", () => {
    renderComponent();
    const tabs = screen.getAllByRole("tab");
    expect(tabs.length).toEqual(2);
    expect(tabs[0]).toHaveTextContent("Groups");
    expect(tabs[1]).toHaveTextContent("Roles");
  });
  it("should search and filter users groups on search", async () => {
    renderComponent();
    const searchInput = screen.getAllByTestId("t--acl-search-input");
    expect(searchInput).toHaveLength(1);

    const groups = screen.queryAllByText("Administrator");
    expect(groups).toHaveLength(1);

    await fireEvent.change(searchInput[0], { target: { value: "test" } });
    expect(searchInput[0]).toHaveValue("test");

    const searched = screen.queryAllByText("Test_Admin");
    expect(searched).toHaveLength(1);

    await waitFor(() => {
      const filtered = screen.queryAllByText("Administrator");
      return expect(filtered).toHaveLength(0);
    });
  });
  it("should search and filter roles on search", async () => {
    renderComponent();
    const searchInput = screen.getAllByTestId("t--acl-search-input");
    expect(searchInput).toHaveLength(1);

    const tabs = screen.getAllByRole("tab");
    expect(tabs.length).toEqual(2);
    tabs[1].click();

    const groups = screen.queryAllByText("Administrator-PG");
    expect(groups).toHaveLength(1);

    await fireEvent.change(searchInput[0], { target: { value: "test" } });
    expect(searchInput[0]).toHaveValue("test");

    const searched = screen.queryAllByText("Test_Admin-PG");
    expect(searched).toHaveLength(1);

    await waitFor(() => {
      const filtered = screen.queryAllByText("Administrator-PG");
      return expect(filtered).toHaveLength(0);
    });
  });
  it("should mark group to be removed", () => {
    renderComponent();
    const tabs = screen.getAllByRole("tab");
    tabs[0].click();
    const activeGroups = screen.getAllByTestId("t--active-group-row");
    fireEvent.click(activeGroups[0]);
    expect(activeGroups[0]).toHaveClass("removed");
  });
  it("should mark group to be added", () => {
    renderComponent();
    const tabs = screen.getAllByRole("tab");
    tabs[0].click();
    const allGroups = screen.getAllByTestId("t--all-group-row");
    fireEvent.click(allGroups[0]);
    expect(allGroups[0]).toHaveClass("added");
  });
  it("should mark role to be removed", () => {
    renderComponent();
    const tabs = screen.getAllByRole("tab");
    tabs[1].click();
    const activeRoles = screen.getAllByTestId("t--active-group-row");
    fireEvent.click(activeRoles[0]);
    expect(activeRoles[0]).toHaveClass("removed");
  });
  it("should mark role to be added", () => {
    renderComponent();
    const tabs = screen.getAllByRole("tab");
    tabs[1].click();
    const allRoles = screen.getAllByTestId("t--all-group-row");
    fireEvent.click(allRoles[0]);
    expect(allRoles[0]).toHaveClass("added");
  });
  it("should show save bottom bar on changing data", async () => {
    renderComponent();
    let saveButton = screen.queryAllByTestId(
      "t--admin-settings-save-button",
    )?.[0];
    expect(saveButton).toBeUndefined();
    const tabs = screen.getAllByRole("tab");
    tabs[0].click();
    const activeGroups = screen.getAllByTestId("t--active-group-row");
    await fireEvent.click(activeGroups[0]);
    expect(activeGroups[0]).toHaveClass("removed");
    const allGroups = screen.getAllByTestId("t--all-group-row");
    await fireEvent.click(allGroups[0]);
    expect(allGroups[0]).toHaveClass("added");
    saveButton = screen.queryAllByTestId("t--admin-settings-save-button")?.[0];
    expect(saveButton).toBeInTheDocument();
    await userEvent.click(saveButton);
    setTimeout(() => {
      saveButton = screen.queryAllByTestId(
        "t--admin-settings-save-button",
      )?.[0];
      expect(saveButton).toBeUndefined();
    }, 5000);
  });
  it("should hide save bottom bar on clicking clear", async () => {
    renderComponent();
    const tabs = screen.getAllByRole("tab");
    tabs[0].click();
    const activeGroups = screen.getAllByTestId("t--active-group-row");
    fireEvent.click(activeGroups[0]);
    expect(activeGroups[0]).toHaveClass("removed");
    const allGroups = screen.getAllByTestId("t--all-group-row");
    fireEvent.click(allGroups[0]);
    expect(allGroups[0]).toHaveClass("added");
    let saveButton = screen.queryAllByTestId(
      "t--admin-settings-save-button",
    )?.[0];
    expect(saveButton).toBeInTheDocument();
    const clearButton = screen.queryAllByTestId(
      "t--admin-settings-reset-button",
    )?.[0];
    expect(clearButton).toBeInTheDocument();
    await clearButton?.click();
    setTimeout(() => {
      saveButton = screen.queryAllByTestId(
        "t--admin-settings-save-button",
      )?.[0];
      expect(saveButton).toBeUndefined();
    }, 5000);
  });
  it("should not display more option if the user doesn't have edit and delete permissions", () => {
    jest
      .spyOn(selectors, "getUserPermissions")
      .mockImplementation(() =>
        mockUserPermissions([
          PERMISSION_TYPE.DELETE_USERS,
          PERMISSION_TYPE.MANAGE_USERS,
        ]),
      );
    const { queryAllByTestId } = renderComponent();
    const moreMenu = queryAllByTestId("t--page-header-actions");
    expect(moreMenu).toHaveLength(0);
  });
  it("should show error message on save when there is no edit permission", async () => {
    jest
      .spyOn(selectors, "getUserPermissions")
      .mockImplementation(() =>
        mockUserPermissions([PERMISSION_TYPE.MANAGE_USERS]),
      );
    const { queryAllByTestId } = renderComponent();
    const tabs = screen.getAllByRole("tab");
    tabs[1].click();
    const activeGroups = queryAllByTestId("t--active-group-row");
    fireEvent.click(activeGroups[0]);
    expect(activeGroups[0]).toHaveClass("removed");
    let saveButton;
    await waitFor(async () => {
      saveButton = screen.getAllByTestId("t--admin-settings-save-button");
      expect(saveButton).toHaveLength(1);
      await fireEvent.click(saveButton[0]);
      const errorMessage = document.getElementsByClassName("cs-text");
      expect(errorMessage).toHaveLength(1);
    });
  });
  it("should show lock icon and disable click for active roles which do not have unassign permission", () => {
    renderComponent();
    const tabs = screen.getAllByRole("tab");
    expect(tabs.length).toEqual(2);
    tabs[1].click();
    const activeRolesData = allUsers[0].roles;
    const roleWithNoUnassignPermission = activeRolesData.findIndex(
      (role: BaseGroupRoleProps) =>
        !role.userPermissions?.includes("unassign:permissionGroups"),
    );
    const activeRoles = screen.queryAllByTestId("t--active-group-row");
    expect(
      activeRoles[roleWithNoUnassignPermission].querySelectorAll(
        "[data-testid='t--lock-icon']",
      ),
    ).toHaveLength(1);
    expect(activeRoles[roleWithNoUnassignPermission]).not.toHaveClass(
      "removed",
    );
    fireEvent.click(activeRoles[roleWithNoUnassignPermission]);
    expect(activeRoles[roleWithNoUnassignPermission]).not.toHaveClass(
      "removed",
    );
  });
});
