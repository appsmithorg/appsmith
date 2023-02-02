import React from "react";
import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "test/testUtils";
import { GroupAddEdit } from "./GroupAddEdit";
import { userGroupTableData } from "./mocks/UserGroupListingMock";
import { BaseGroupRoleProps, GroupEditProps } from "./types";
import * as selectors from "@appsmith/selectors/aclSelectors";
import { mockGroupPermissions } from "./mocks/mockSelectors";
import { PERMISSION_TYPE } from "@appsmith/utils/permissionHelpers";
import userEvent from "@testing-library/user-event";

let container: any = null;

const listMenuItems = [
  {
    className: "rename-menu-item",
    icon: "edit-underline",
    text: "Rename",
    label: "rename",
  },
  {
    className: "rename-desc-menu-item",
    icon: "edit-underline",
    text: "Edit Description",
    label: "rename-desc",
  },
  {
    className: "delete-menu-item",
    icon: "delete-blank",
    onSelect: jest.fn(),
    text: "Delete",
    label: "delete",
  },
];

const props: GroupEditProps = {
  selected: userGroupTableData[0],
  onDelete: jest.fn(),
  isLoading: false,
};

function renderComponent() {
  return render(<GroupAddEdit {...props} />);
}

const toggleDefaultRoles = async () => {
  const toggleWrapper = screen.getByTestId("t--toggle-wrapper");
  const toggleInput = toggleWrapper.getElementsByTagName("input")[0];
  await fireEvent.click(toggleInput);
};

describe("<GroupAddEdit />", () => {
  jest
    .spyOn(selectors, "getGroupPermissions")
    .mockImplementation(mockGroupPermissions as any);
  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
  });
  it("is rendered", () => {
    renderComponent();
    const group = screen.queryAllByTestId("t--user-edit-wrapper");
    expect(group).toHaveLength(1);
  });
  it("should render the selected group name as title", () => {
    renderComponent();
    const title = screen.queryAllByTestId("t--page-title");
    expect(title[0]).toHaveTextContent(props.selected.name);
  });
  it("should show empty state when there are no users", async () => {
    renderComponent();
    const emptyState = screen.queryByTestId("t--user-edit-tabs-wrapper");
    expect(emptyState).toBeTruthy();
    const emptyStateMessage = screen.queryByTestId("t--no-users-msg");
    expect(emptyStateMessage).toHaveTextContent(
      /There are no users added to this group/i,
    );
    const button = screen.getByTestId("t--add-users-button");
    expect(emptyState).toContainElement(button);
    expect(button).toHaveTextContent("Add Users");
    fireEvent.click(button);
    const modal = screen.queryByTestId("t--dialog-component");
    expect(modal).toBeTruthy();
  });
  it("should search and filter users on search", async () => {
    const selectedGroup = userGroupTableData[1];
    const props = {
      selected: selectedGroup,
      onDelete: jest.fn(),
      isLoading: false,
      isEditing: false,
    };
    render(<GroupAddEdit {...props} />);
    const searchInput = screen.getAllByTestId("t--acl-search-input");
    expect(searchInput).toHaveLength(1);

    const tabs = screen.getAllByRole("tab");
    const tab = tabs[0];
    fireEvent.click(tab);

    const tabCount = screen.queryAllByTestId("t--tab-count");
    expect(tabCount).toHaveLength(2);
    const mockCounts = [
      userGroupTableData[1].users.length.toString(),
      userGroupTableData[1].roles.length.toString(),
    ];
    expect(tabCount.map((tab) => tab.textContent)).toEqual(mockCounts);

    await fireEvent.change(searchInput[0], { target: { value: "k" } });
    expect(searchInput[0]).toHaveValue("k");

    const searched = screen.queryAllByText("techak@appsmith.com");
    expect(searched).toHaveLength(1);

    const mockedSearchResults = ["1", "1"];

    await waitFor(() => {
      const tabCount = screen.queryAllByTestId("t--tab-count");
      const filtered = screen.queryAllByText("hello123@appsmith.com");
      expect(filtered).toHaveLength(0);
      expect(tabCount).toHaveLength(tabs.length);
      expect(tabCount.map((tab) => tab.textContent)).toEqual(
        mockedSearchResults,
      );
    });
  });
  it("should display active and all roles properly with icons for default roles", () => {
    renderComponent();
    const tabs = screen.getAllByRole("tab");
    expect(tabs.length).toEqual(2);
    tabs[1].click();
    const activeRolesData = userGroupTableData[0].roles;
    const allRolesData = userGroupTableData[0].allRoles;
    const customRolesData = userGroupTableData[0].allRoles.filter(
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
  it("should search and filter roles on search", async () => {
    const selectedGroup = userGroupTableData[1];
    const props = {
      selected: selectedGroup,
      onDelete: jest.fn(),
      isLoading: false,
      isEditing: false,
    };
    render(<GroupAddEdit {...props} />);
    const searchInput = screen.getAllByTestId("t--acl-search-input");
    expect(searchInput).toHaveLength(1);

    const tabs = screen.getAllByRole("tab");
    const tab = tabs[1];
    fireEvent.click(tab);

    const tabCount = screen.queryAllByTestId("t--tab-count");
    expect(tabCount).toHaveLength(2);
    const mockCounts = [
      userGroupTableData[1].users.length.toString(),
      userGroupTableData[1].roles.length.toString(),
    ];
    expect(tabCount.map((tab) => tab.textContent)).toEqual(mockCounts);

    await fireEvent.change(searchInput[0], { target: { value: "k" } });
    expect(searchInput[0]).toHaveValue("k");

    const searched = screen.queryAllByText("marketing_nov");
    expect(searched).toHaveLength(1);

    const mockedSearchResults = ["1", "1"];

    await waitFor(() => {
      const count = tabs[1];
      return expect(count).toBeTruthy();
    });

    await waitFor(() => {
      const tabCount = screen.queryAllByTestId("t--tab-count");
      const filtered = screen.queryAllByText("devops_eng_nov");
      expect(filtered).toHaveLength(0);
      expect(tabCount).toHaveLength(tabs.length);
      expect(tabCount.map((tab) => tab.textContent)).toEqual(
        mockedSearchResults,
      );
    });
  });
  it("should list the correct options in the more menu", async () => {
    const { getAllByTestId, getAllByText } = renderComponent();
    const moreMenu = getAllByTestId("t--page-header-actions");
    await fireEvent.click(moreMenu[0]);
    const options = listMenuItems.map((menuItem) => menuItem.text);
    const menuElements = options.map((option) => getAllByText(option)).flat();
    options.forEach((option, index) => {
      expect(menuElements[index]).toHaveTextContent(option);
    });
  });
  it("should show input box on group name on clicking title", async () => {
    renderComponent();
    let titleEl = document.getElementsByClassName("t--editable-title");
    expect(titleEl[0]).not.toHaveClass("bp3-editable-text-editing");
    await fireEvent.click(titleEl[0]);
    titleEl = document.getElementsByClassName("t--editable-title");
    expect(titleEl[0]).toHaveClass("bp3-editable-text-editing");
    expect(titleEl[0]).not.toHaveTextContent("New Group name");

    const inputEl = titleEl[0].getElementsByTagName("input")[0];
    await userEvent.type(inputEl, "New Group name");
    await userEvent.keyboard("{enter}");
    titleEl = document.getElementsByClassName("t--editable-title");
    expect(titleEl[0]).not.toHaveClass("bp3-editable-text-editing");
    expect(titleEl[0]).toHaveTextContent("New Group name");
  });
  it("should show input box on group name on clicking rename menu item", async () => {
    const { getAllByTestId } = renderComponent();
    const moreMenu = getAllByTestId("t--page-header-actions");
    await fireEvent.click(moreMenu[0]);
    let titleEl = document.getElementsByClassName("t--editable-title");
    expect(titleEl[0]).not.toHaveClass("bp3-editable-text-editing");
    const renameOption = getAllByTestId("t--rename-menu-item");
    await fireEvent.click(renameOption[0]);
    titleEl = document.getElementsByClassName("t--editable-title");
    expect(titleEl[0]).toHaveClass("bp3-editable-text-editing");
    expect(titleEl[0]).not.toHaveTextContent("New Group name");

    const inputEl = titleEl[0].getElementsByTagName("input")[0];
    await userEvent.type(inputEl, "New Group name");
    await userEvent.keyboard("{enter}");
    titleEl = document.getElementsByClassName("t--editable-title");
    expect(titleEl[0]).not.toHaveClass("bp3-editable-text-editing");
    expect(titleEl[0]).toHaveTextContent("New Group name");
  });
  it("should show input box on group description on clicking edit description menu item", async () => {
    const { getAllByTestId } = renderComponent();
    const moreMenu = getAllByTestId("t--page-header-actions");
    await fireEvent.click(moreMenu[0]);
    let titleEl = document.getElementsByClassName("t--editable-description");
    expect(titleEl).toHaveLength(0);
    const renameOption = getAllByTestId("t--rename-desc-menu-item");
    await fireEvent.click(renameOption[0]);
    titleEl = document.getElementsByClassName("t--editable-description");
    expect(titleEl).toHaveLength(1);
    expect(titleEl[0]).toHaveClass("bp3-editable-text-editing");
    expect(titleEl[0]).not.toHaveTextContent(
      "This is dummy description for this group.",
    );

    const inputEl = titleEl[0].getElementsByTagName("textarea")[0];
    await userEvent.type(inputEl, "This is dummy description for this group.");
    // await userEvent.keyboard("{Shift>}{enter}");
    titleEl = document.getElementsByClassName("t--editable-description");
    // expect(titleEl[0]).not.toHaveClass("bp3-editable-text-editing");
    expect(titleEl[0]).toHaveTextContent(
      "This is dummy description for this group.",
    );
  });
  it("should delete the group when Delete menu item is clicked", async () => {
    const { getAllByTestId } = renderComponent();
    const moreMenu = getAllByTestId("t--page-header-actions");
    await userEvent.click(moreMenu[0]);
    const deleteOption = getAllByTestId("t--delete-menu-item");
    expect(deleteOption[0]).toHaveTextContent("Delete");
    expect(deleteOption[0]).not.toHaveTextContent("Are you sure?");
    await userEvent.click(deleteOption[0]);
    const confirmationText = getAllByTestId("t--delete-menu-item");
    expect(confirmationText[0]).toHaveTextContent("Are you sure?");
    await userEvent.dblClick(deleteOption[0]);
    expect(props.onDelete).toHaveBeenCalledWith(props.selected.id);
    expect(window.location.pathname).toEqual("/settings/groups");
  });
  it("should contain two tabs", () => {
    renderComponent();
    const tabs = screen.getAllByRole("tab");
    expect(tabs.length).toEqual(2);
    expect(tabs[0]).toHaveTextContent("Users");
    expect(tabs[1]).toHaveTextContent("Roles");
  });
  it("should mark group to be removed", () => {
    renderComponent();
    const tabs = screen.getAllByRole("tab");
    tabs[1].click();
    const activeGroups = screen.getAllByTestId("t--active-group-row");
    fireEvent.click(activeGroups[0]);
    expect(activeGroups[0]).toHaveClass("removed");
  });
  it("should mark group to be added", () => {
    renderComponent();
    const tabs = screen.getAllByRole("tab");
    tabs[1].click();
    const allGroups = screen.getAllByTestId("t--all-group-row");
    fireEvent.click(allGroups[0]);
    expect(allGroups[0]).toHaveClass("added");
  });
  it("should show save bottom bar on changing data", async () => {
    renderComponent();
    let saveButton = screen.queryAllByTestId(
      "t--admin-settings-save-button",
    )?.[0];
    expect(saveButton).toBeUndefined();
    const tabs = screen.getAllByRole("tab");
    tabs[1].click();
    const activeGroups = screen.getAllByTestId("t--active-group-row");
    await fireEvent.click(activeGroups[0]);
    expect(activeGroups[0]).toHaveClass("removed");
    const allGroups = screen.getAllByTestId("t--all-group-row");
    await fireEvent.click(allGroups[0]);
    expect(allGroups[0]).toHaveClass("added");
    saveButton = screen.queryAllByTestId("t--admin-settings-save-button")?.[0];
    expect(saveButton).toBeInTheDocument();
    await saveButton?.click();
    saveButton = screen.queryAllByTestId("t--admin-settings-save-button")?.[0];
    expect(saveButton).toBeUndefined();
  });
  it("should hide save bottom bar on clicking clear", async () => {
    renderComponent();
    const tabs = screen.getAllByRole("tab");
    tabs[1].click();
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
    saveButton = screen.queryAllByTestId("t--admin-settings-save-button")?.[0];
    expect(saveButton).toBeUndefined();
  });
  it("should disable Add users CTA when there is no addUsers:userGroups permission", () => {
    jest
      .spyOn(selectors, "getGroupPermissions")
      .mockImplementation(() =>
        mockGroupPermissions([PERMISSION_TYPE.ADD_USERS_TO_USERGROUPS]),
      );
    renderComponent();
    const addUsersButton = screen.getByTestId("t--add-users-button");
    expect(addUsersButton).toHaveAttribute("disabled");
  });
  it("should display only the options which the user is permitted to", async () => {
    jest
      .spyOn(selectors, "getGroupPermissions")
      .mockImplementation(() =>
        mockGroupPermissions([PERMISSION_TYPE.DELETE_USERGROUPS]),
      );
    const { queryAllByTestId } = renderComponent();
    const moreMenu = queryAllByTestId("t--page-header-actions");
    expect(moreMenu).toHaveLength(1);
    await fireEvent.click(moreMenu[0]);
    const deleteOption = queryAllByTestId("t--delete-menu-item");
    const editOption = queryAllByTestId("t--rename-menu-item");
    const editDescOption = queryAllByTestId("t--rename-desc-menu-item");

    expect(deleteOption).toHaveLength(0);
    expect(editOption).toHaveLength(1);
    expect(editDescOption).toHaveLength(1);
  });
  it("should not display more option if the user doesn't have edit and delete permissions", () => {
    jest
      .spyOn(selectors, "getGroupPermissions")
      .mockImplementation(() =>
        mockGroupPermissions([
          PERMISSION_TYPE.DELETE_USERGROUPS,
          PERMISSION_TYPE.MANAGE_USERGROUPS,
        ]),
      );
    const { queryAllByTestId } = renderComponent();
    const moreMenu = queryAllByTestId("t--page-header-actions");
    expect(moreMenu).toHaveLength(0);
  });
  it("should not make title editable when user don't have edit permission", () => {
    jest
      .spyOn(selectors, "getGroupPermissions")
      .mockImplementation(() =>
        mockGroupPermissions([PERMISSION_TYPE.MANAGE_USERGROUPS]),
      );
    const { queryAllByTestId } = renderComponent();
    const editIcon = queryAllByTestId("t--action-name-edit-icon");
    expect(editIcon).toHaveLength(0);
    const editableTitle = queryAllByTestId("t--editable-title");
    expect(editableTitle).toHaveLength(0);
    const editableDesc = queryAllByTestId("t--editable-description");
    expect(editableDesc).toHaveLength(0);
  });
  it("should show error message on save when there is no edit permission", async () => {
    jest
      .spyOn(selectors, "getGroupPermissions")
      .mockImplementation(() =>
        mockGroupPermissions([PERMISSION_TYPE.MANAGE_USERGROUPS]),
      );
    const { queryAllByTestId } = renderComponent();
    const tabs = screen.getAllByRole("tab");
    tabs[1].click();
    const activeGroups = queryAllByTestId("t--active-group-row");
    await fireEvent.click(activeGroups[0]);
    expect(activeGroups[0]).toHaveClass("removed");
    let saveButton;
    await waitFor(async () => {
      saveButton = screen.getAllByTestId("t--admin-settings-save-button");
      expect(saveButton).toHaveLength(1);
      await fireEvent.click(saveButton[0]);
      const errorMessage = await document.getElementsByClassName("cs-text");
      expect(errorMessage).toHaveLength(1);
    });
  });
  it("should show lock icon and disable click for active roles which do not have unassign permission", () => {
    renderComponent();
    const tabs = screen.getAllByRole("tab");
    expect(tabs.length).toEqual(2);
    tabs[1].click();
    const activeRolesData = userGroupTableData[0].roles;
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
