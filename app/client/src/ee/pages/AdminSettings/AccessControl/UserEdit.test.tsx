import React from "react";
import "@testing-library/jest-dom";
import { render, screen, waitFor } from "test/testUtils";
import { allUsers } from "./mocks/UserListingMock";
import userEvent from "@testing-library/user-event";
import { UserEdit } from "./UserEdit";

let container: any = null;

const onDeleteHandler = jest.fn();

const selectedUser = allUsers[0];

const props = {
  onDelete: onDeleteHandler,
  searchPlaceholder: "Search users",
  selectedUser,
  isLoading: false,
  isSaving: false,
};

function renderComponent() {
  return render(<UserEdit {...props} />);
}

describe("<UserEdit />", () => {
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
  it("should show delete option on click of more action icon", () => {
    const { getAllByTestId } = renderComponent();
    const moreMenu = getAllByTestId("actions-cell-menu-icon");
    userEvent.click(moreMenu[0]);
    const menu = document.getElementsByClassName("delete-menu-item");
    expect(menu).toHaveLength(1);
  });
  it("should show confirmation message when the delete user option is clicked", async () => {
    const { getAllByTestId } = renderComponent();
    const moreMenu = getAllByTestId("actions-cell-menu-icon");
    await userEvent.click(moreMenu[0]);
    const menu = document.getElementsByClassName("delete-menu-item");
    expect(menu[0]).toHaveTextContent("Delete");
    expect(menu[0]).not.toHaveTextContent("Are you sure?");
    await userEvent.click(menu[0]);
    const confirmationText = document.getElementsByClassName(
      "delete-menu-item",
    );
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

    await userEvent.type(searchInput[0], "test");
    expect(searchInput[0]).toHaveValue("test");

    const searched = screen.queryAllByText("Test_Admin");
    expect(searched).toHaveLength(1);

    waitFor(() => {
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

    await userEvent.type(searchInput[0], "test");
    expect(searchInput[0]).toHaveValue("test");

    const searched = screen.queryAllByText("Test_Admin-PG");
    expect(searched).toHaveLength(1);

    waitFor(() => {
      const filtered = screen.queryAllByText("Administrator-PG");
      return expect(filtered).toHaveLength(0);
    });
  });
  it("should mark group to be removed", () => {
    renderComponent();
    const tabs = screen.getAllByRole("tab");
    tabs[1].click();
    const activeGroups = screen.getAllByTestId("t--active-group-row");
    userEvent.click(activeGroups[0]);
    expect(activeGroups[0]).toHaveClass("removed");
  });
});
