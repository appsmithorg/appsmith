import React from "react";
import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "test/testUtils";
import { UserListing } from "./UserListing";
import { allUsers } from "./mocks/UserListingMock";
import configureStore from "redux-mock-store";
import { Provider } from "react-redux";
import * as userSelectors from "selectors/usersSelectors";
import type { UserProps } from "./types";
import * as aclActions from "@appsmith/actions/aclActions";
jest.mock("lodash/debounce", () => jest.fn((fn) => fn));

const spy = jest.spyOn(aclActions, "fetchAclUsers");

let container: any = null;
const onSelectFn = jest.fn();

const listMenuItems = [
  {
    label: "edit",
    className: "edit-menu-item",
    icon: "pencil-line",
    onSelect: onSelectFn,
    text: "Edit",
  },
  {
    label: "delete",
    className: "delete-menu-item",
    icon: "delete-bin-line",
    onSelect: onSelectFn,
    text: "Delete",
  },
];

function renderComponent() {
  /* Mock store to bypass the error of react-redux */
  const store = configureStore()({
    acl: {
      roles: [],
      users: {
        content: allUsers,
        count: allUsers.length,
        startIndex: 0,
        total: 4,
      },
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
    spy.mockClear();
  });
  it("is rendered", async () => {
    renderComponent();
    const userListing = screen.queryAllByTestId("user-listing-wrapper");
    expect(userListing).toHaveLength(1);
  });
  it("should navigate to user edit page on click of username", async () => {
    renderComponent();
    const userEditLink = await screen.queryAllByTestId("user-listing-userCell");
    await fireEvent.click(userEditLink[0]);
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
      fireEvent.click(showMore[0]);
      showLess = screen.queryAllByTestId("t--show-less");
      expect(showLess).toHaveLength(1);
      fireEvent.click(showLess[0]);
      showMore = screen.queryAllByTestId("t--show-more");
      showLess = screen.queryAllByTestId("t--show-less");
      expect(showLess).toHaveLength(0);
      expect(showMore).not.toHaveLength(0);
    }
  });
  it("should list the correct options in the more menu", async () => {
    const { getAllByTestId, getAllByText } = renderComponent();
    const moreMenu = getAllByTestId("actions-cell-menu-icon");
    await fireEvent.click(moreMenu[0]);
    const options = listMenuItems.map((menuItem: any) => menuItem.text);
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
    await fireEvent.click(moreMenu[0]);
    const editOption = getAllByTestId("t--edit-menu-item");
    await fireEvent.click(editOption[0]);
    expect(window.location.pathname).toEqual(
      `/settings/users/${allUsers[0].id}`,
    );
  });
  it("should render link-unlink icon for provisioned groups", () => {
    renderComponent();
    const user = screen.getAllByTestId("user-listing-userCell");
    allUsers.forEach((u: UserProps, index: number) => {
      if (u?.isProvisioned) {
        expect(
          user[index].querySelectorAll(
            "[data-testid='t--provisioned-resource']",
          ),
        ).not.toHaveLength(1);
      } else {
        expect(
          user[index].querySelectorAll(
            "[data-testid='t--provisioned-resource']",
          ),
        ).toHaveLength(0);
      }
    });
  });
  it("should search and filter users on search", async () => {
    renderComponent();
    const searchInput = screen.getAllByTestId("t--acl-search-input");
    expect(searchInput).toHaveLength(1);

    const groups = screen.queryAllByText("techak@appsmith.com");
    expect(groups).toHaveLength(1);

    await fireEvent.change(searchInput[0], { target: { value: "sangy123" } });
    expect(searchInput[0]).toHaveValue("sangy123");
    expect(spy).toBeCalled();
    expect(spy).toHaveBeenLastCalledWith({ searchTerm: "SANGY123" });
  });
  it("should delete the user when Delete menu option is clicked", async () => {
    const { getAllByTestId, queryByText } = renderComponent();
    let user = queryByText(allUsers[0].username);
    expect(user).toBeInTheDocument();
    const moreMenu = getAllByTestId("actions-cell-menu-icon");
    await fireEvent.click(moreMenu[0]);
    const deleteOption = getAllByTestId("t--delete-menu-item");
    expect(deleteOption[0]).toHaveTextContent("Delete");
    expect(deleteOption[0]).not.toHaveTextContent("Are you sure?");
    await fireEvent.click(deleteOption[0]);
    waitFor(async () => {
      const confirmText = getAllByTestId("t--delete-menu-item");
      expect(confirmText[0]).toHaveTextContent("Are you sure?");
      await fireEvent.dblClick(deleteOption[0]);
      user = queryByText(allUsers[0].username);
      expect(user).not.toBeInTheDocument();
    });
  });
  it("should render in custom url", async () => {
    render(<UserListing />, {
      url: `/settings/users/${allUsers[0].id}`,
    });
    expect(window.location.pathname).toEqual(
      `/settings/users/${allUsers[0].id}`,
    );
  });
  it("should display only the options which the user is permitted to", async () => {
    const { queryAllByTestId, queryByText } = renderComponent();
    const user = queryByText(allUsers[1].username);
    expect(user).toBeInTheDocument();
    const moreMenu = queryAllByTestId("actions-cell-menu-icon");
    expect(moreMenu).toHaveLength(3);
    await fireEvent.click(moreMenu[1]);
    const deleteOption = queryAllByTestId("t--delete-menu-item");
    const editOption = queryAllByTestId("t--edit-menu-item");

    expect(deleteOption).toHaveLength(0);
    expect(editOption).toHaveLength(1);
  });
  it("should not display more option if the user doesn't have edit and delete permissions", () => {
    const { queryAllByTestId, queryByText } = renderComponent();
    const user = queryByText(allUsers[2].username);
    expect(user).toBeInTheDocument();
    const moreMenu = queryAllByTestId("actions-cell-menu-icon");
    expect(moreMenu).toHaveLength(3);
  });
  it("should disable 'Add users' CTA if the user is not super user", () => {
    jest.spyOn(userSelectors, "getCurrentUser").mockReturnValue({
      isSuperUser: false,
    } as any);
    renderComponent();
    const button = screen.getAllByTestId("t--acl-page-header-input");
    expect(button[0]).toHaveAttribute("disabled");
  });
});
