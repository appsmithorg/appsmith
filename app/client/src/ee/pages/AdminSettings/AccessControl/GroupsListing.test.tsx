import React from "react";
import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "test/testUtils";
import { GroupListing } from "./GroupsListing";
import { userGroupTableData } from "./mocks/UserGroupListingMock";
import configureStore from "redux-mock-store";
import { Provider } from "react-redux";
import userEvent from "@testing-library/user-event";

let container: any = null;

const listMenuItems = [
  {
    className: "edit-menu-item",
    icon: "edit-underline",
    onSelect: jest.fn(),
    text: "Edit",
    label: "edit",
  },
  {
    className: "delete-menu-item",
    icon: "delete-blank",
    onSelect: jest.fn(),
    text: "Delete",
    label: "delete",
  },
];

function renderComponent() {
  /* Mock store to bypass the error of react-redux */
  const store = configureStore()({
    acl: {
      roles: [],
      users: [],
      groups: userGroupTableData,
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
      <GroupListing />
    </Provider>,
  );
}

describe("<GroupListing />", () => {
  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
  });
  it("is rendered", () => {
    renderComponent();
    const userGroupListing = screen.queryAllByTestId(
      "t--group-listing-wrapper",
    );
    expect(userGroupListing).toHaveLength(1);
  });
  it("should navigate to user edit page on click of group name", async () => {
    renderComponent();
    const userGroupEditLink = await screen.getAllByTestId("t--usergroup-cell");
    await fireEvent.click(userGroupEditLink[0]);
    expect(window.location.pathname).toBe(
      `/settings/groups/${userGroupTableData[0].id}`,
    );
  });
  it("should list the correct options in the more menu", async () => {
    const { getAllByTestId, getAllByText } = renderComponent();
    const moreMenu = getAllByTestId("actions-cell-menu-icon");
    await fireEvent.click(moreMenu[0]);
    const options = listMenuItems.map((menuItem) => menuItem.text);
    const menuElements = options.map((option) => getAllByText(option)).flat();
    options.forEach((option, index) => {
      expect(menuElements[index]).toHaveTextContent(option);
    });
  });
  it("should navigate to edit page when Edit list menu item is clicked", async () => {
    const { getAllByTestId } = renderComponent();
    const moreMenu = getAllByTestId("actions-cell-menu-icon");
    await fireEvent.click(moreMenu[0]);
    const editOption = getAllByTestId("t--edit-menu-item");
    await fireEvent.click(editOption[0]);
    expect(window.location.pathname).toEqual(
      `/settings/groups/${userGroupTableData[0].id}`,
    );
  });
  it("should search and filter users groups on search", async () => {
    renderComponent();
    const searchInput = screen.getAllByTestId("t--acl-search-input");
    expect(searchInput).toHaveLength(1);

    const groups = screen.queryAllByText("Eng_New");
    expect(groups).toHaveLength(1);

    await fireEvent.change(searchInput[0], { target: { value: "Design" } });
    expect(searchInput[0]).toHaveValue("Design");

    const searched = screen.queryAllByText("Design");
    expect(searched).toHaveLength(1);

    waitFor(() => {
      const filtered = screen.queryAllByText("Eng_New");
      return expect(filtered).toHaveLength(0);
    });
  });
  it("should delete the group when Delete list menu item is clicked", async () => {
    const { getAllByTestId, queryByText } = renderComponent();
    let userGroup = queryByText(userGroupTableData[0].name);
    expect(userGroup).toBeInTheDocument();
    const moreMenu = getAllByTestId("actions-cell-menu-icon");
    await userEvent.click(moreMenu[0]);
    const deleteOption = getAllByTestId("t--delete-menu-item");
    expect(deleteOption[0]).toHaveTextContent("Delete");
    expect(deleteOption[0]).not.toHaveTextContent("Are you sure?");
    await userEvent.click(deleteOption[0]);
    const confirmText = getAllByTestId("t--delete-menu-item");
    expect(confirmText[0]).toHaveTextContent("Are you sure?");
    await userEvent.dblClick(deleteOption[0]);
    userGroup = queryByText(userGroupTableData[0].name);
    expect(userGroup).not.toBeInTheDocument();
  });
  it("should render in custom url", async () => {
    render(<GroupListing />, {
      url: `/settings/groups/${userGroupTableData[0].id}`,
    });
    expect(window.location.pathname).toEqual(
      `/settings/groups/${userGroupTableData[0].id}`,
    );
  });
  it("should display only the options which the user is permitted to", async () => {
    const { queryAllByTestId, queryByText } = renderComponent();
    const userGroup = queryByText(userGroupTableData[2].name);
    expect(userGroup).toBeInTheDocument();
    const moreMenu = queryAllByTestId("actions-cell-menu-icon");
    expect(moreMenu).toHaveLength(2);
    await fireEvent.click(moreMenu[1]);
    const deleteOption = queryAllByTestId("t--delete-menu-item");
    const editOption = queryAllByTestId("t--edit-menu-item");

    expect(deleteOption).toHaveLength(0);
    expect(editOption).toHaveLength(1);
  });
  it("should not display more option if the user doesn't have edit and delete permissions", () => {
    const { queryAllByTestId, queryByText } = renderComponent();
    const userGroup = queryByText(userGroupTableData[1].name);
    expect(userGroup).toBeInTheDocument();
    const moreMenu = queryAllByTestId("actions-cell-menu-icon");
    expect(moreMenu).toHaveLength(2);
  });
  it("should disable 'Add group' CTA if the tenant level manage group permission is absent", () => {
    renderComponent();
    const button = screen.getAllByTestId("t--acl-page-header-input");
    expect(button[0]).toHaveAttribute("disabled");
  });
});
