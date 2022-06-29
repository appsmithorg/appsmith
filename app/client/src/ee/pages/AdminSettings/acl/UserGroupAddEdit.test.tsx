import React from "react";
import "@testing-library/jest-dom";
import { render, screen, waitFor } from "test/testUtils";
import { UserGroupAddEdit, UserGroupEditProps } from "./UserGroupAddEdit";
import { userGroupTableData } from "./UserGroupListing";
import userEvent from "@testing-library/user-event";

let container: any = null;

const listMenuItems = [
  {
    className: "clone-menu-item",
    icon: "duplicate",
    onSelect: jest.fn(),
    text: "Clone User Group",
    label: "clone",
  },
  {
    className: "rename-menu-item",
    icon: "edit-underline",
    text: "Rename User Group",
    label: "rename",
  },
  {
    className: "delete-menu-item",
    icon: "delete-blank",
    onSelect: jest.fn(),
    text: "Delete User Group",
    label: "delete",
  },
];

const props: UserGroupEditProps = {
  selected: userGroupTableData[0],
  onClone: jest.fn(),
  onDelete: jest.fn(),
};

function renderComponent() {
  return render(<UserGroupAddEdit {...props} />);
}

describe("<UserGroupAddEdit />", () => {
  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
  });
  it("is rendered", () => {
    renderComponent();
    const userGroup = screen.queryAllByTestId("t--user-edit-wrapper");
    expect(userGroup).toHaveLength(1);
  });
  it("should render the selected user group name as title", () => {
    renderComponent();
    const title = screen.queryAllByTestId("t--editatble-title");
    expect(title[0]).toHaveTextContent(props.selected.rolename);
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
    // userEvent.click(button);
    // const modal = screen.getByText(/invite users/i);
    // expect(modal).toBeTruthy();
  });
  it("should search and filter users on search", async () => {
    const selectedGroup = userGroupTableData[1];
    const props = {
      selected: selectedGroup,
      onClone: jest.fn(),
      onDelete: jest.fn(),
    };
    render(<UserGroupAddEdit {...props} />);
    const searchInput = screen.getAllByTestId("t--acl-search-input");
    expect(searchInput).toHaveLength(1);

    const tab = screen.getByText(`Users (${props.selected.allUsers.length})`);
    userEvent.click(tab);

    await userEvent.type(searchInput[0], "k");
    expect(searchInput[0]).toHaveValue("k");

    const searched = screen.queryAllByText("techak@appsmith.com");
    expect(searched).toHaveLength(1);

    await waitFor(() => {
      const count = screen.getByText("Users (1)");
      return expect(count).toBeTruthy();
    });

    await waitFor(() => {
      const filtered = screen.queryAllByText("hello123@appsmith.com");
      return expect(filtered).toHaveLength(0);
    });
  });
  it("should search and filter permission groups on search", async () => {
    const selectedGroup = userGroupTableData[1];
    const props = {
      selected: selectedGroup,
      onClone: jest.fn(),
      onDelete: jest.fn(),
    };
    render(<UserGroupAddEdit {...props} />);
    const searchInput = screen.getAllByTestId("t--acl-search-input");
    expect(searchInput).toHaveLength(1);

    const tab = screen.getByText(
      `Permissions (${props.selected.activePermissions.length +
        props.selected.allPermissions.length})`,
    );
    userEvent.click(tab);

    await userEvent.type(searchInput[0], "k");
    expect(searchInput[0]).toHaveValue("k");

    const searched = screen.queryAllByText("marketing_nov");
    expect(searched).toHaveLength(1);

    await waitFor(() => {
      const count = screen.getByText("Permissions (1)");
      return expect(count).toBeTruthy();
    });

    await waitFor(() => {
      const filtered = screen.queryAllByText("devops_eng_nov");
      return expect(filtered).toHaveLength(0);
    });
  });
  it("should list the correct options in the more menu", async () => {
    const { getAllByTestId, getAllByText } = renderComponent();
    const moreMenu = getAllByTestId("t--page-header-actions");
    await userEvent.click(moreMenu[0]);
    const options = listMenuItems.map((menuItem) => menuItem.text);
    const menuElements = options.map((option) => getAllByText(option)).flat();
    options.map((option, index) => {
      expect(menuElements[index]).toHaveTextContent(option);
    });
  });
  it("should show input box on group name on double clicking title", async () => {
    const { getAllByTestId } = renderComponent();
    const moreMenu = getAllByTestId("t--page-header-actions");
    await userEvent.click(moreMenu[0]);
    let titleEl = document.getElementsByClassName("t--editable-title");
    expect(titleEl[0]).not.toContain("input");
    await userEvent.dblClick(titleEl[0]);
    titleEl = document.getElementsByClassName("t--editable-title");
    expect(titleEl[0]).toContainHTML("input");
  });
  /*it("should clone the group when Clone menu item is clicked", async () => {
    const { getAllByTestId } = renderComponent();
    const moreMenu = getAllByTestId("t--page-header-actions");
    await userEvent.click(moreMenu[0]);
    const cloneOption = document.getElementsByClassName("clone-menu-item");
    await userEvent.click(cloneOption[0]);
    await waitFor(
      () => {
        expect(window.location.pathname).toEqual("/settings/user-groups");
        const clonedGroup = screen.queryByText(
          `Copy of ${props.selected.rolename}`,
        );
        return expect(clonedGroup).toBeTruthy();
      },
      { timeout: 1000 },
    );
  });*/
  it("should show input box on group name on clicking rename menu item", async () => {
    const { getAllByTestId } = renderComponent();
    const moreMenu = getAllByTestId("t--page-header-actions");
    await userEvent.click(moreMenu[0]);
    const cloneOption = document.getElementsByClassName("rename-menu-item");
    let titleEl = document.getElementsByClassName("t--editable-title");
    expect(titleEl[0]).not.toContain("input");
    await userEvent.click(cloneOption[0]);
    titleEl = document.getElementsByClassName("t--editable-title");
    expect(titleEl[0]).toContainHTML("input");
  });
  /*it("should delete the group when Delete menu item is clicked", async () => {
    const { getAllByTestId, getByText } = renderComponent();
    const moreMenu = getAllByTestId("t--page-header-actions");
    await userEvent.click(moreMenu[0]);
    const deleteOption = document.getElementsByClassName("delete-menu-item");
    expect(deleteOption[0]).toHaveTextContent("Delete User Group");
    expect(deleteOption[0]).not.toHaveTextContent("Are you sure?");
    await userEvent.click(deleteOption[0]);
    const confirmationText = document.getElementsByClassName(
      "delete-menu-item",
    );
    expect(confirmationText[0]).toHaveTextContent("Are you sure?");
    await userEvent.dblClick(deleteOption[0]);
    await waitFor(
      () => {
        expect(window.location.pathname).toEqual("/settings/user-groups");
        const deletedGroup = screen.queryByText(props.selected.rolename);
        return expect(deletedGroup).toBeFalsy();
      },
      { timeout: 1000 },
    );
  });*/
  it("should contain two tabs", () => {
    renderComponent();
    const tabs = screen.getAllByRole("tab");
    expect(tabs.length).toEqual(2);
    expect(tabs[0]).toHaveTextContent("Users");
    expect(tabs[1]).toHaveTextContent("Permissions");
  });
  it("should mark group to be removed", () => {
    renderComponent();
    const tabs = screen.getAllByRole("tab");
    tabs[1].click();
    const activeGroups = screen.getAllByTestId("t--active-group-row");
    userEvent.click(activeGroups[0]);
    expect(activeGroups[0]).toHaveClass("removed");
  });
  it("should mark group to be added", () => {
    renderComponent();
    const tabs = screen.getAllByRole("tab");
    tabs[1].click();
    const allGroups = screen.getAllByTestId("t--all-group-row");
    userEvent.click(allGroups[0]);
    expect(allGroups[0]).toHaveClass("added");
  });
});
