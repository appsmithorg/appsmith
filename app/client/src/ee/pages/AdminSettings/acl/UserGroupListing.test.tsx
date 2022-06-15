import React from "react";
import "@testing-library/jest-dom";
import { render, screen } from "test/testUtils";
import { UserGroupListing, userGroupTableData } from "./UserGroupListing";
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
    className: "edit-menu-item",
    icon: "edit-underline",
    onSelect: jest.fn(),
    text: "Edit User Group",
    label: "edit",
  },
  {
    className: "delete-menu-item",
    icon: "delete-blank",
    onSelect: jest.fn(),
    text: "Delete User Group",
    label: "delete",
  },
];

function renderComponent() {
  return render(<UserGroupListing />);
}

describe("<UserGroupListing />", () => {
  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
  });
  it("is rendered", () => {
    renderComponent();
    const userGroupListing = screen.queryAllByTestId(
      "t--user-group-listing-wrapper",
    );
    expect(userGroupListing).toHaveLength(1);
  });
  it("should navigate to user edit page on click of user group name", async () => {
    renderComponent();
    const userGroupEditLink = screen.getAllByTestId("t--usergroup-cell");
    await userEvent.click(userGroupEditLink[0]);
    expect(window.location.pathname).toBe(
      `/settings/user-groups/${userGroupTableData[0].id}`,
    );
  });
  it("should render appsmith badge for appsmith provided user group", () => {
    renderComponent();
    const userGroup = screen.getAllByTestId("t--usergroup-cell");
    const appsmithBadge = screen.getAllByTestId("t--appsmith-badge");
    const appsmithProvided = userGroupTableData.filter(
      (group) => group.isAppsmithProvided,
    );
    expect(appsmithBadge.length).toEqual(appsmithProvided.length);
    userGroupTableData.map((group, index) => {
      if (!group.isAppsmithProvided) {
        expect(
          userGroup[index].querySelectorAll(
            "[data-testid='t--appsmith-badge']",
          ),
        ).toHaveLength(0);
      } else {
        expect(
          userGroup[index].querySelectorAll(
            "[data-testid='t--appsmith-badge']",
          ),
        ).not.toHaveLength(0);
      }
    });
  });
  it("should list the correct options in the more menu", async () => {
    const { getAllByTestId, getAllByText } = renderComponent();
    const moreMenu = getAllByTestId("actions-cell-menu-icon");
    await userEvent.click(moreMenu[0]);
    const options = listMenuItems.map((menuItem) => menuItem.text);
    const menuElements = options.map((option) => getAllByText(option)).flat();
    options.map((option, index) => {
      expect(menuElements[index]).toHaveTextContent(option);
    });
  });
  it("should clone the group when Clone list menu item is clicked", async () => {
    const { getAllByTestId, queryByText } = renderComponent();
    const moreMenu = getAllByTestId("actions-cell-menu-icon");
    await userEvent.click(moreMenu[0]);
    const cloneOption = document.getElementsByClassName("clone-menu-item");
    let clonedGroup = queryByText(`Copy of ${userGroupTableData[0].rolename}`);
    expect(clonedGroup).toBeFalsy();
    await userEvent.click(cloneOption[0]);
    clonedGroup = queryByText(`Copy of ${userGroupTableData[0].rolename}`);
    expect(clonedGroup).toBeTruthy();
  });
  it("should navigate to edit page when Edit list menu item is clicked", async () => {
    const { getAllByTestId } = renderComponent();
    const moreMenu = getAllByTestId("actions-cell-menu-icon");
    await userEvent.click(moreMenu[0]);
    const editOption = document.getElementsByClassName("edit-menu-item");
    await userEvent.click(editOption[0]);
    expect(window.location.pathname).toEqual(
      `/settings/user-groups/${userGroupTableData[0].id}`,
    );
  });
  it("should delete the group when Delete list menu item is clicked", async () => {
    const { getAllByTestId, queryByText } = renderComponent();
    let userGroup = queryByText(userGroupTableData[0].rolename);
    expect(userGroup).toBeInTheDocument();
    const moreMenu = getAllByTestId("actions-cell-menu-icon");
    await userEvent.click(moreMenu[0]);
    const deleteOption = document.getElementsByClassName("delete-menu-item");
    expect(deleteOption[0]).toHaveTextContent("Delete User Group");
    expect(deleteOption[0]).not.toHaveTextContent("Are you sure?");
    await userEvent.click(deleteOption[0]);
    const confirmText = document.getElementsByClassName("delete-menu-item");
    expect(confirmText[0]).toHaveTextContent("Are you sure?");
    await userEvent.dblClick(deleteOption[0]);
    userGroup = queryByText(userGroupTableData[0].rolename);
    expect(userGroup).not.toBeInTheDocument();
  });
  it("should render in custom url", async () => {
    render(<UserGroupListing />, {
      url: `/settings/user-groups/${userGroupTableData[0].id}`,
    });
    expect(window.location.pathname).toEqual(
      `/settings/user-groups/${userGroupTableData[0].id}`,
    );
  });
});
