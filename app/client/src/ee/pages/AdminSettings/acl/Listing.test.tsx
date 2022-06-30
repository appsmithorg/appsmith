import React from "react";
import "@testing-library/jest-dom";
import { render, screen, waitFor } from "test/testUtils";
import { Listing } from "./Listing";
import { columns } from "./mocks/UserListingMock";
import userEvent from "@testing-library/user-event";
import { allUsers } from "./UserListing";

let container: any = null;
const onSelectFn = jest.fn();

const props = {
  data: [],
  columns: [],
  listMenuItems: [],
  keyAccessor: "",
};

const userListingProps = {
  data: allUsers,
  columns: columns,
  listMenuItems: [
    {
      className: "edit-menu-item",
      icon: "edit-underline",
      onSelect: onSelectFn,
      text: "Edit User Groups",
      label: "edit",
    },
    {
      className: "delete-menu-item",
      icon: "delete-blank",
      onSelect: onSelectFn,
      text: "Delete User",
      label: "delete",
    },
  ],
  keyAccessor: "userId",
};

function renderComponent() {
  render(<Listing {...props} />);
}

describe("<Listing />", () => {
  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
  });
  it("is rendered", () => {
    renderComponent();
    const userListing = screen.queryAllByTestId("listing-wrapper");
    expect(userListing).toHaveLength(1);
  });
  it("should render empty state when there is no data", () => {
    render(<Listing {...props} />);
    const emptyState = document.getElementsByClassName("no-data-title");
    expect(emptyState).toHaveLength(1);
  });
  it("should render table with given data", () => {
    const { getAllByTestId } = render(<Listing {...userListingProps} />);
    const actual = getAllByTestId("user-listing-userCell").map(
      (cell) => cell.textContent,
    );
    const expected = userListingProps.data.map((user) => user.username);
    expect(actual).toEqual(expected);
  });
  it("should set 'active' class on click of more menu", async () => {
    const { getAllByTestId } = render(<Listing {...userListingProps} />);
    const moreMenu = getAllByTestId("actions-cell-menu-icon");
    expect(moreMenu[0]).not.toHaveClass("active");
    userEvent.click(moreMenu[0]);
    expect(moreMenu[0]).toHaveClass("active");
  });
  it("should list correct options in menu", async () => {
    const { getAllByTestId, getAllByText } = render(
      <Listing {...userListingProps} />,
    );
    const moreMenu = getAllByTestId("actions-cell-menu-icon");
    await userEvent.click(moreMenu[0]);
    const menuItems = userListingProps.listMenuItems
      .map((item) => getAllByText(item.text))
      .flat();
    expect(menuItems).toHaveLength(2);
    expect(menuItems[0]).toHaveTextContent(
      userListingProps.listMenuItems[0].text,
    );
    expect(menuItems[1]).toHaveTextContent(
      userListingProps.listMenuItems[1].text,
    );
    await userEvent.click(menuItems[0]);
    expect(userListingProps.listMenuItems[0].onSelect).toHaveBeenCalled();
    await userEvent.click(menuItems[1]);
    expect(userListingProps.listMenuItems[1].onSelect).toHaveBeenCalled();
  });
  it("should ask for confirmation when deleting", async () => {
    const { getAllByTestId, queryByText } = render(
      <Listing {...userListingProps} />,
    );
    const user = queryByText(userListingProps.data[0].username);
    expect(user).toBeInTheDocument();
    const moreMenu = getAllByTestId("actions-cell-menu-icon");
    userEvent.click(moreMenu[0]);
    const deleteOption = document.getElementsByClassName("delete-menu-item");
    expect(deleteOption[0]).toHaveTextContent("Delete User");
    expect(deleteOption[0]).not.toHaveTextContent("Are you sure?");
    expect(() => userEvent.click(deleteOption[0])).toThrow();
    // const confirmText = document.getElementsByClassName("delete-menu-item");
    // expect(confirmText[0]).toHaveTextContent("Are you sure?");
    // await userEvent.dblClick(deleteOption[0]);
    // user = queryByText(userListingProps.data[0].username);
    // expect(user).not.toBeInTheDocument();
    waitFor(() => {
      expect(userListingProps.listMenuItems[1].onSelect).toHaveBeenCalledTimes(
        1,
      );
    });
  });
});
