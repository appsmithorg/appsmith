import React from "react";
import "@testing-library/jest-dom";
import { render, screen, waitFor } from "test/testUtils";
import { GroupListing } from "./GroupsListing";
import { userGroupTableData } from "./mocks/UserGroupListingMock";
import userEvent from "@testing-library/user-event";
import configureStore from "redux-mock-store";
import { Provider } from "react-redux";

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
    await userEvent.click(userGroupEditLink[0]);
    expect(window.location.pathname).toBe(
      `/settings/groups/${userGroupTableData[0].id}`,
    );
  });
  it("should test new group gets created on Add group button click", () => {
    renderComponent();
    const button = screen.getAllByTestId("t--acl-page-header-input");
    button[0].click();
    /* expect(window.location.pathname).toEqual(`/settings/groups/10109`); */
  });
  it("should list the correct options in the more menu", async () => {
    const { getAllByTestId, getAllByText } = renderComponent();
    const moreMenu = getAllByTestId("actions-cell-menu-icon");
    await userEvent.click(moreMenu[0]);
    const options = listMenuItems.map((menuItem) => menuItem.text);
    const menuElements = options.map((option) => getAllByText(option)).flat();
    options.forEach((option, index) => {
      expect(menuElements[index]).toHaveTextContent(option);
    });
  });
  it("should navigate to edit page when Edit list menu item is clicked", async () => {
    const { getAllByTestId } = renderComponent();
    const moreMenu = getAllByTestId("actions-cell-menu-icon");
    await userEvent.click(moreMenu[0]);
    const editOption = document.getElementsByClassName("edit-menu-item");
    await userEvent.click(editOption[0]);
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

    await userEvent.type(searchInput[0], "Design");
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
    const deleteOption = document.getElementsByClassName("delete-menu-item");
    expect(deleteOption[0]).toHaveTextContent("Delete");
    expect(deleteOption[0]).not.toHaveTextContent("Are you sure?");
    await userEvent.click(deleteOption[0]);
    const confirmText = document.getElementsByClassName("delete-menu-item");
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
});
