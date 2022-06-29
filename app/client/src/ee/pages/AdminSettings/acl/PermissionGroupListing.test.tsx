import React from "react";
import "@testing-library/jest-dom";
import { render, screen } from "test/testUtils";
import {
  PermissionGroupListing,
  permissionGroupTableData,
} from "./PermissionGroupListing";
import userEvent from "@testing-library/user-event";
import { MenuItemProps } from "components/ads";

let container: any = null;

const listMenuItems: MenuItemProps[] = [
  {
    className: "clone-menu-item",
    icon: "duplicate",
    onSelect: jest.fn(),
    text: "Clone Permission Group",
    label: "clone",
  },
  {
    className: "edit-menu-item",
    icon: "edit-underline",
    onSelect: jest.fn(),
    text: "Edit Permission Group",
    label: "edit",
  },
  {
    className: "delete-menu-item",
    icon: "delete-blank",
    onSelect: jest.fn(),
    text: "Delete Permission Group",
    label: "delete",
  },
];

function renderComponent() {
  return render(<PermissionGroupListing />);
}

describe("<PermissionGroupListing />", () => {
  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
  });
  it("is rendered", () => {
    renderComponent();
    const permissionGroupListing = screen.queryAllByTestId(
      "t--permission-group-listing-wrapper",
    );
    expect(permissionGroupListing).toHaveLength(1);
  });
  it("should navigate to permission group edit page on click of permission group name", async () => {
    renderComponent();
    const permissionGroupEditLink = screen.getAllByTestId(
      "t--permissionGroup-cell",
    );
    await userEvent.click(permissionGroupEditLink[0]);
    expect(window.location.pathname).toBe(
      `/settings/permission-groups/${permissionGroupTableData[0].id}`,
    );
  });
  it("should render appsmith badge for appsmith provided permission group", () => {
    renderComponent();
    const permissionGroup = screen.getAllByTestId("t--permissionGroup-cell");
    const appsmithBadge = screen.getAllByTestId("t--appsmith-badge");
    const appsmithProvided = permissionGroupTableData.filter(
      (group) => group.isAppsmithProvided,
    );
    expect(appsmithBadge.length).toEqual(appsmithProvided.length);
    permissionGroupTableData.map((group, index) => {
      if (!group.isAppsmithProvided) {
        expect(
          permissionGroup[index].querySelectorAll(
            "[data-testid='t--appsmith-badge']",
          ),
        ).toHaveLength(0);
      } else {
        expect(
          permissionGroup[index].querySelectorAll(
            "[data-testid='t--appsmith-badge']",
          ),
        ).not.toHaveLength(0);
      }
    });
  });
  it("should test new group gets created on Add group button click", () => {
    renderComponent();
    const button = screen.getAllByTestId("t--acl-page-header-input");
    button[0].click();
    expect(window.location.pathname).toEqual(
      `/settings/permission-groups/10102`,
    );
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
    let clonedGroup = queryByText(
      `Copy of ${permissionGroupTableData[0].permissionName}`,
    );
    expect(clonedGroup).toBeFalsy();
    await userEvent.click(cloneOption[0]);
    clonedGroup = queryByText(
      `Copy of ${permissionGroupTableData[0].permissionName}`,
    );
    expect(clonedGroup).toBeTruthy();
    expect(clonedGroup?.nextSibling).toBeFalsy();
  });
  it("should navigate to permission group edit page when Edit list menu option is clicked", async () => {
    const { getAllByTestId } = renderComponent();
    const moreMenu = getAllByTestId("actions-cell-menu-icon");
    await userEvent.click(moreMenu[0]);
    const editOption = document.getElementsByClassName("edit-menu-item");
    await userEvent.click(editOption[0]);
    expect(window.location.pathname).toEqual(
      `/settings/permission-groups/${permissionGroupTableData[0].id}`,
    );
  });
  it("should delete the group when Delete list menu item is clicked", async () => {
    const { getAllByTestId, queryByText } = renderComponent();
    let permissionGroup = queryByText(
      permissionGroupTableData[0].permissionName,
    );
    expect(permissionGroup).toBeInTheDocument();
    const moreMenu = getAllByTestId("actions-cell-menu-icon");
    await userEvent.click(moreMenu[0]);
    const deleteOption = document.getElementsByClassName("delete-menu-item");
    expect(deleteOption[0]).toHaveTextContent("Delete Permission Group");
    expect(deleteOption[0]).not.toHaveTextContent("Are you sure?");
    await userEvent.click(deleteOption[0]);
    const confirmText = document.getElementsByClassName("delete-menu-item");
    expect(confirmText[0]).toHaveTextContent("Are you sure?");
    await userEvent.dblClick(deleteOption[0]);
    permissionGroup = queryByText(permissionGroupTableData[0].permissionName);
    expect(permissionGroup).not.toBeInTheDocument();
  });
  it("should render in custom url", async () => {
    render(<PermissionGroupListing />, {
      url: `/settings/permission-groups/${permissionGroupTableData[0].id}`,
    });
    expect(window.location.pathname).toEqual(
      `/settings/permission-groups/${permissionGroupTableData[0].id}`,
    );
  });
});
