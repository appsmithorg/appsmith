import React from "react";
import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "test/testUtils";
import { PageHeader } from "./PageHeader";
import { UserListing } from "./UserListing";
import { allUsers } from "./mocks/UserListingMock";
import configureStore from "redux-mock-store";
import { Provider } from "react-redux";

let container: any = null;
const handleChange = jest.fn();
const mockOnSelect = jest.fn();

const pageMenuItems = [
  {
    icon: "book-line",
    onSelect: mockOnSelect,
    text: "Documentation",
  },
];

function renderComponent() {
  render(
    <PageHeader
      buttonText="Add"
      onSearch={handleChange as any}
      pageMenuItems={pageMenuItems}
      searchPlaceholder="Search users"
      searchValue=""
    />,
  );
}

function renderUserListing() {
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

describe("<PageHeader />", () => {
  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    renderComponent();
  });
  it("is rendered", () => {
    const searchInput = screen.queryAllByTestId("t--acl-search-input");
    expect(searchInput).toHaveLength(1);
  });
  it("should search and filter results for the given search query", async () => {
    const searchInput = screen.queryAllByTestId("t--acl-search-input");
    await fireEvent.change(searchInput[0], { target: { value: "test value" } });
    expect(searchInput[0]).toHaveValue("test value");
  });
  it("should have a button with text Add", () => {
    const button = screen.queryAllByTestId("t--acl-page-header-input");
    expect(button).toHaveLength(1);
    expect(button[0]).toHaveTextContent("Add");
  });
  it("should filter user list based on search value", async () => {
    renderUserListing();
    const searchInput = screen.queryAllByTestId("t--acl-search-input");

    const users = screen.queryAllByText("sangy123@appsmith.com");
    expect(users).toHaveLength(1);

    await fireEvent.change(searchInput[0], { target: { value: "techak" } });
    expect(searchInput[0]).toHaveValue("techak");

    const searched = screen.queryAllByText("techak@appsmith.com");
    expect(searched).toHaveLength(1);

    const filtered = screen.queryAllByText("sangy@123@appsmith.com");
    expect(filtered).toHaveLength(0);
  });
  it("should show menu options on click of more", async () => {
    const moreMenu = screen.queryAllByTestId("t--page-header-actions");
    let menuOptions = screen.queryAllByText(/Documentation/i);
    expect(menuOptions).toHaveLength(0);

    await fireEvent.click(moreMenu[0]);

    menuOptions = screen.queryAllByText(/Documentation/i);
    expect(menuOptions).toHaveLength(1);

    await fireEvent.click(menuOptions[0]);
    expect(pageMenuItems[0].onSelect).toHaveBeenCalled();
  });
});
