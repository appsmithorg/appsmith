import React from "react";
import "@testing-library/jest-dom";
import { render, screen, waitFor } from "test/testUtils";
import { UserListing } from "./UserListing";
import { allUsers } from "./mocks/UserListingMock";
import userEvent from "@testing-library/user-event";
import configureStore from "redux-mock-store";
import { Provider } from "react-redux";
import { MenuItemProps } from "design-system";

let container: any = null;
const onSelectFn = jest.fn();

const listMenuItems = [
  {
    label: "edit",
    className: "edit-menu-item",
    icon: "edit-underline",
    onSelect: onSelectFn,
    text: "Edit",
  },
  {
    label: "delete",
    className: "delete-menu-item",
    icon: "delete-blank",
    onSelect: onSelectFn,
    text: "Delete",
  },
];

function renderComponent() {
  /* Mock store to bypass the error of react-redux */
  const store = configureStore()({
    acl: {
      roles: [],
      users: allUsers,
      groups: [],
      isLoading: false,
      isSaving: false,
      selectedGroup: null,
      selectedUser: null,
      selectedRole: null,
      inviteOptions: {
        groups: [],
        roles: [],
      },
    },
  });
  return render(
    <Provider store={store}>
      <UserListing />
    </Provider>,
  );
}

describe("<UserListing />", () => {
  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
  });
  it("is rendered", async () => {
    renderComponent();
    const userListing = screen.queryAllByTestId("user-listing-wrapper");
    expect(userListing).toHaveLength(1);
  });
  it("should navigate to user edit page on click of username", async () => {
    renderComponent();
    const userEditLink = await screen.queryAllByTestId("user-listing-userCell");
    await userEvent.click(userEditLink[0]);
    expect(window.location.pathname).toBe(`/settings/users/${allUsers[0].id}`);
  });
  it("should expand on show more and collapse on show less", () => {
    renderComponent();
    let showMore = screen.queryAllByTestId("t--show-more");
    let showLess = screen.queryAllByTestId("t--show-less");

    if (showMore.length > 0) {
      expect(showMore[0]).toHaveTextContent(`show 1 more`);
      expect(showLess).toHaveLength(0);
      expect(showMore).not.toHaveLength(0);
      userEvent.click(showMore[0]);
      showLess = screen.queryAllByTestId("t--show-less");
      expect(showLess).toHaveLength(1);
      userEvent.click(showLess[0]);
      showMore = screen.queryAllByTestId("t--show-more");
      showLess = screen.queryAllByTestId("t--show-less");
      expect(showLess).toHaveLength(0);
      expect(showMore).not.toHaveLength(0);
    }
  });
  it("should list the correct options in the more menu", async () => {
    const { getAllByTestId, getAllByText } = renderComponent();
    const moreMenu = getAllByTestId("actions-cell-menu-icon");
    await userEvent.click(moreMenu[0]);
    const options = listMenuItems.map(
      (menuItem: MenuItemProps) => menuItem.text,
    );
    const menuElements = options
      .map((option: string) => getAllByText(option))
      .flat();
    options.forEach((option: string, index: number) => {
      expect(menuElements[index]).toHaveTextContent(option);
    });
  });
  it("should navigate to edit page when Edit menu option is clicked", async () => {
    const { getAllByTestId } = renderComponent();
    const moreMenu = getAllByTestId("actions-cell-menu-icon");
    await userEvent.click(moreMenu[0]);
    const editOption = document.getElementsByClassName("edit-menu-item");
    await userEvent.click(editOption[0]);
    expect(window.location.pathname).toEqual(
      `/settings/users/${allUsers[0].id}`,
    );
  });
  /*it("should search and filter users on search", async () => {
    renderComponent();
    const searchInput = screen.getAllByTestId("t--acl-search-input");
    expect(searchInput).toHaveLength(1);

    const groups = screen.queryAllByText("Ankita Kinger");
    expect(groups).toHaveLength(1);

    await userEvent.type(searchInput[0], "sivan");
    expect(searchInput[0]).toHaveValue("sivan");

    const searched = screen.queryAllByText("SS Sivan");
    expect(searched).toHaveLength(1);

    waitFor(() => {
      const filtered = screen.queryAllByText("Ankita Kinger");
      return expect(filtered).toHaveLength(0);
    });
  });*/
  it("should delete the user when Delete menu option is clicked", async () => {
    const { getAllByTestId, queryByText } = renderComponent();
    let user = queryByText(allUsers[0].username);
    expect(user).toBeInTheDocument();
    const moreMenu = getAllByTestId("actions-cell-menu-icon");
    await userEvent.click(moreMenu[0]);
    const deleteOption = document.getElementsByClassName("delete-menu-item");
    expect(deleteOption[0]).toHaveTextContent("Delete");
    expect(deleteOption[0]).not.toHaveTextContent("Are you sure?");
    await userEvent.click(deleteOption[0]);
    const confirmText = document.getElementsByClassName("delete-menu-item");
    expect(confirmText[0]).toHaveTextContent("Are you sure?");
    await userEvent.dblClick(deleteOption[0]);
    user = queryByText(allUsers[0].username);
    expect(user).not.toBeInTheDocument();
  });
  it("should render in custom url", async () => {
    render(<UserListing />, {
      url: `/settings/users/${allUsers[0].id}`,
    });
    expect(window.location.pathname).toEqual(
      `/settings/users/${allUsers[0].id}`,
    );
  });
});
