import React from "react";
import "@testing-library/jest-dom";
import { render, screen, waitFor } from "test/testUtils";
import { GroupAddEdit } from "./GroupAddEdit";
import { userGroupTableData } from "./mocks/UserGroupListingMock";
import userEvent from "@testing-library/user-event";
import { GroupEditProps } from "./types";

let container: any = null;

const listMenuItems = [
  {
    className: "rename-menu-item",
    icon: "edit-underline",
    text: "Rename",
    label: "rename",
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
  isSaving: false,
};

function renderComponent() {
  return render(<GroupAddEdit {...props} />);
}

describe("<GroupAddEdit />", () => {
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
    /* userEvent.click(button);
       const modal = screen.getByText(/invite users/i);
       expect(modal).toBeTruthy(); */
  });
  it("should search and filter users on search", async () => {
    const selectedGroup = userGroupTableData[1];
    const props = {
      selected: selectedGroup,
      onDelete: jest.fn(),
      isLoading: false,
      isSaving: false,
    };
    render(<GroupAddEdit {...props} />);
    const searchInput = screen.getAllByTestId("t--acl-search-input");
    expect(searchInput).toHaveLength(1);

    const tab = screen.getByText("Users");
    userEvent.click(tab);

    const tabs = screen.getAllByRole("tab");
    const tabCount = screen.queryAllByTestId("t--tab-count");
    expect(tabCount).toHaveLength(2);
    const mockCounts = [
      userGroupTableData[1].users.length.toString(),
      userGroupTableData[1].roles.length.toString(),
    ];
    expect(tabCount.map((tab) => tab.textContent)).toEqual(mockCounts);

    await userEvent.type(searchInput[0], "k");
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
  it("should search and filter roles on search", async () => {
    const selectedGroup = userGroupTableData[1];
    const props = {
      selected: selectedGroup,
      onDelete: jest.fn(),
      isLoading: false,
      isSaving: false,
    };
    render(<GroupAddEdit {...props} />);
    const searchInput = screen.getAllByTestId("t--acl-search-input");
    expect(searchInput).toHaveLength(1);

    const tab = screen.getByText(`Roles`);
    userEvent.click(tab);

    const tabs = screen.getAllByRole("tab");
    const tabCount = screen.queryAllByTestId("t--tab-count");
    expect(tabCount).toHaveLength(2);
    const mockCounts = [
      userGroupTableData[1].users.length.toString(),
      userGroupTableData[1].roles.length.toString(),
    ];
    expect(tabCount.map((tab) => tab.textContent)).toEqual(mockCounts);

    await userEvent.type(searchInput[0], "k");
    expect(searchInput[0]).toHaveValue("k");

    const searched = screen.queryAllByText("marketing_nov");
    expect(searched).toHaveLength(1);

    const mockedSearchResults = ["1", "1"];

    await waitFor(() => {
      const count = screen.getByText("Roles");
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
    await userEvent.click(moreMenu[0]);
    const options = listMenuItems.map((menuItem) => menuItem.text);
    const menuElements = options.map((option) => getAllByText(option)).flat();
    options.forEach((option, index) => {
      expect(menuElements[index]).toHaveTextContent(option);
    });
  });
  it("should show input box on group name on double clicking title", async () => {
    const { getAllByTestId } = renderComponent();
    const moreMenu = getAllByTestId("t--page-header-actions");
    await userEvent.click(moreMenu[0]);
    let titleEl = getAllByTestId("t--page-title");
    expect(titleEl[0]).not.toContain("input");
    await userEvent.dblClick(titleEl[0]);
    titleEl = getAllByTestId("t--page-title");
    expect(titleEl[0]).toContainHTML("input");
  });
  it("should show input box on group name on clicking rename menu item", async () => {
    const { getAllByTestId } = renderComponent();
    const moreMenu = getAllByTestId("t--page-header-actions");
    await userEvent.click(moreMenu[0]);
    const renameOption = document.getElementsByClassName("rename-menu-item");
    let titleEl = getAllByTestId("t--page-title");
    expect(titleEl[0]).not.toContain("input");
    await userEvent.dblClick(titleEl[0]);
    titleEl = getAllByTestId("t--page-title");
    expect(titleEl[0]).toContainHTML("input");
  });
  /*it("should delete the group when Delete menu item is clicked", async () => {
    const { getAllByTestId, getByText } = renderComponent();
    const moreMenu = getAllByTestId("t--page-header-actions");
    await userEvent.click(moreMenu[0]);
    const deleteOption = document.getElementsByClassName("delete-menu-item");
    expect(deleteOption[0]).toHaveTextContent("Delete");
    expect(deleteOption[0]).not.toHaveTextContent("Are you sure?");
    await userEvent.click(deleteOption[0]);
    const confirmationText = document.getElementsByClassName(
      "delete-menu-item",
    );
    expect(confirmationText[0]).toHaveTextContent("Are you sure?");
    await userEvent.dblClick(deleteOption[0]);
    await waitFor(
      () => {
        expect(window.location.pathname).toEqual("/settings/groups");
        const deletedGroup = screen.queryByText(props.selected.name);
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
    expect(tabs[1]).toHaveTextContent("Roles");
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
