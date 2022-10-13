import React from "react";
import "@testing-library/jest-dom";
import { render, screen } from "test/testUtils";
import { RolesListing } from "./RolesListing";
import { rolesTableData } from "./mocks/RolesListingMock";
import userEvent from "@testing-library/user-event";
import { MenuItemProps } from "design-system";
import configureStore from "redux-mock-store";
import { Provider } from "react-redux";

let container: any = null;

const listMenuItems: MenuItemProps[] = [
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
      roles: rolesTableData,
      users: [],
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
      <RolesListing />
    </Provider>,
  );
}

describe("<RoleListing />", () => {
  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
  });
  it("is rendered", () => {
    renderComponent();
    const rolesListing = screen.queryAllByTestId("t--roles-listing-wrapper");
    expect(rolesListing).toHaveLength(1);
  });
  it("should navigate to role edit page on click of role name", async () => {
    renderComponent();
    const roleEditLink = await screen.getAllByTestId("t--roles-cell");
    await userEvent.click(roleEditLink[0]);
    expect(window.location.pathname).toBe(
      `/settings/roles/${rolesTableData[0].id}`,
    );
  });
  /*it("should render appsmith badge for appsmith provided role", () => {
    renderComponent();
    const role = screen.getAllByTestId("t--roles-cell");
    const appsmithBadge = screen.getAllByTestId("t--appsmith-badge");
    const appsmithProvided = rolesTableData.filter(
      (role: any) => role.isAppsmithProvided,
    );
    expect(appsmithBadge.length).toEqual(appsmithProvided.length);
    rolesTableData.forEach((group: any, index: any) => {
      if (!group.isAppsmithProvided) {
        expect(
          role[index].querySelectorAll("[data-testid='t--appsmith-badge']"),
        ).toHaveLength(0);
      } else {
        expect(
          role[index].querySelectorAll("[data-testid='t--appsmith-badge']"),
        ).not.toHaveLength(0);
      }
    });
  });*/
  it("should test new group gets created on Add group button click", () => {
    renderComponent();
    const button = screen.getAllByTestId("t--acl-page-header-input");
    button[0].click();
    /* expect(window.location.pathname).toEqual(`/settings/roles/10102`); */
  });
  it("should list the correct options in the more menu", async () => {
    const { getAllByTestId, getAllByText } = renderComponent();
    const moreMenu = getAllByTestId("actions-cell-menu-icon");
    await userEvent.click(moreMenu[0]);
    const options = listMenuItems.map((menuItem: any) => menuItem.text);
    const menuElements = options
      .map((option: any) => getAllByText(option))
      .flat();
    options.forEach((option: any, index: any) => {
      expect(menuElements[index]).toHaveTextContent(option);
    });
  });
  it("should navigate to role edit page when Edit list menu option is clicked", async () => {
    const { getAllByTestId } = renderComponent();
    const moreMenu = getAllByTestId("actions-cell-menu-icon");
    await userEvent.click(moreMenu[0]);
    const editOption = document.getElementsByClassName("edit-menu-item");
    await userEvent.click(editOption[0]);
    expect(window.location.pathname).toEqual(
      `/settings/roles/${rolesTableData[0].id}`,
    );
  });
  it("should delete the group when Delete list menu item is clicked", async () => {
    const { getAllByTestId, queryByText } = renderComponent();
    let role = queryByText(rolesTableData[0].name);
    expect(role).toBeInTheDocument();
    const moreMenu = getAllByTestId("actions-cell-menu-icon");
    await userEvent.click(moreMenu[0]);
    const deleteOption = document.getElementsByClassName("delete-menu-item");
    expect(deleteOption[0]).toHaveTextContent("Delete");
    expect(deleteOption[0]).not.toHaveTextContent("Are you sure?");
    await userEvent.click(deleteOption[0]);
    const confirmText = document.getElementsByClassName("delete-menu-item");
    expect(confirmText[0]).toHaveTextContent("Are you sure?");
    await userEvent.dblClick(deleteOption[0]);
    role = queryByText(rolesTableData[0].name);
    expect(role).not.toBeInTheDocument();
  });
  it("should render in custom url", async () => {
    render(<RolesListing />, {
      url: `/settings/roles/${rolesTableData[0].id}`,
    });
    expect(window.location.pathname).toEqual(
      `/settings/roles/${rolesTableData[0].id}`,
    );
  });
});
