import React from "react";
import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "test/testUtils";
import { RolesListing } from "./RolesListing";
import { rolesTableData } from "./mocks/RolesListingMock";
import { MenuItemProps } from "design-system-old";
import configureStore from "redux-mock-store";
import { Provider } from "react-redux";
import { RoleProps } from "./types";
import userEvent from "@testing-library/user-event";

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

const toggleDefaultRoles = async () => {
  const toggleWrapper = screen.getByTestId("t--toggle-wrapper");
  const toggleInput = toggleWrapper.getElementsByTagName("input")[0];
  await fireEvent.click(toggleInput);
};

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
  it("should show only custom roles by default", () => {
    renderComponent();
    const role = screen.getAllByTestId("t--roles-cell");
    const defaultRoles = rolesTableData.filter((r: RoleProps) => r.autoCreated);
    const customRoles = rolesTableData.filter((r: RoleProps) => !r.autoCreated);
    expect(customRoles.length).toEqual(role.length);
    defaultRoles.forEach((r: RoleProps) => {
      const roleText = screen.queryAllByText(r.name);
      return expect(roleText).toHaveLength(0);
    });
  });
  it("should show default and custom roles on checking the default roles toggle", () => {
    renderComponent();
    toggleDefaultRoles();
    const role = screen.getAllByTestId("t--roles-cell");
    const defaultRoles = rolesTableData.filter((r: RoleProps) => r.autoCreated);
    const customRoles = rolesTableData.filter((r: RoleProps) => !r.autoCreated);
    expect(defaultRoles.length + customRoles.length).toEqual(role.length);
    defaultRoles.forEach((r: RoleProps) => {
      const roleText = screen.queryAllByText(r.name);
      return expect(roleText).not.toHaveLength(0);
    });
  });
  it("should navigate to role edit page on click of role name", async () => {
    renderComponent();
    const roleEditLink = screen.getAllByTestId("t--roles-cell");
    await fireEvent.click(roleEditLink[0]);
    expect(window.location.pathname).toBe(
      `/settings/roles/${rolesTableData[0].id}`,
    );
  });
  it("should render appsmith badge for appsmith provided role", () => {
    renderComponent();
    toggleDefaultRoles();
    const role = screen.getAllByTestId("t--roles-cell");
    const appsmithBadge = screen.queryAllByTestId("t--appsmith-badge");
    const appsmithProvided = rolesTableData.filter(
      (r: RoleProps) => r.autoCreated,
    );
    expect(appsmithBadge.length).toEqual(appsmithProvided.length);
    rolesTableData.forEach((r: RoleProps, index: number) => {
      if (!r.autoCreated) {
        expect(
          role[index].querySelectorAll("[data-testid='t--appsmith-badge']"),
        ).toHaveLength(0);
      } else {
        expect(
          role[index].querySelectorAll("[data-testid='t--appsmith-badge']"),
        ).not.toHaveLength(0);
      }
    });
  });
  it("should list the correct options in the more menu", async () => {
    const { getAllByTestId, getAllByText } = renderComponent();
    const moreMenu = getAllByTestId("actions-cell-menu-icon");
    await fireEvent.click(moreMenu[0]);
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
  it("should navigate to role edit page when Edit list menu option is clicked", async () => {
    const { getAllByTestId } = renderComponent();
    const moreMenu = getAllByTestId("actions-cell-menu-icon");
    await fireEvent.click(moreMenu[0]);
    const editOption = getAllByTestId("t--edit-menu-item");
    await fireEvent.click(editOption[0]);
    expect(window.location.pathname).toEqual(
      `/settings/roles/${rolesTableData[0].id}`,
    );
  });
  it("should search and filter roles on search", async () => {
    renderComponent();
    const searchInput = screen.getAllByTestId("t--acl-search-input");
    expect(searchInput).toHaveLength(1);

    const groups = screen.queryAllByText("HR_Appsmith");
    expect(groups).toHaveLength(1);

    await fireEvent.change(searchInput[0], { target: { value: "devops" } });
    expect(searchInput[0]).toHaveValue("devops");

    const searched = screen.queryAllByText("devops_design");
    expect(searched).toHaveLength(1);

    await waitFor(() => {
      const filtered = screen.queryAllByText("HR_Appsmith");
      return expect(filtered).toHaveLength(0);
    });
  });
  it("should delete the role when Delete list menu item is clicked", async () => {
    const { getAllByTestId, queryByText } = renderComponent();
    let role = queryByText(rolesTableData[0].name);
    expect(role).toBeInTheDocument();
    const moreMenu = getAllByTestId("actions-cell-menu-icon");
    await userEvent.click(moreMenu[0]);
    const deleteOption = getAllByTestId("t--delete-menu-item");
    expect(deleteOption[0]).toHaveTextContent("Delete");
    expect(deleteOption[0]).not.toHaveTextContent("Are you sure?");
    await userEvent.click(deleteOption[0]);
    const confirmText = getAllByTestId("t--delete-menu-item");
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
  it("should display icon next to role name based on persmissions", () => {
    renderComponent();
    toggleDefaultRoles();
    const role = screen.getAllByTestId("t--roles-cell");
    rolesTableData.forEach((r: RoleProps, index: number) => {
      if (r.userPermissions?.includes("manage:permissionGroups")) {
        expect(
          role[index].querySelectorAll("[data-testid='t--edit-icon']"),
        ).toHaveLength(1);
        expect(
          role[index].querySelectorAll("[data-testid='t--crossed-edit-icon']"),
        ).toHaveLength(0);
      } else {
        expect(
          role[index].querySelectorAll("[data-testid='t--edit-icon']"),
        ).toHaveLength(0);
        expect(
          role[index].querySelectorAll("[data-testid='t--crossed-edit-icon']"),
        ).toHaveLength(1);
      }
    });
  });
  it("should display only the options which the user is permitted to", async () => {
    const { queryAllByTestId, queryByText } = renderComponent();
    toggleDefaultRoles();
    const role = queryByText(rolesTableData[2].name);
    expect(role).toBeInTheDocument();
    const moreMenu = queryAllByTestId("actions-cell-menu-icon");
    expect(moreMenu).toHaveLength(6);
    await fireEvent.click(moreMenu[2]);
    const deleteOption = queryAllByTestId("t--delete-menu-item");
    const editOption = queryAllByTestId("t--edit-menu-item");

    expect(deleteOption).toHaveLength(0);
    expect(editOption).toHaveLength(1);
  });
  it("should not display more option if the user doesn't have edit and delete permissions", () => {
    const { queryAllByTestId, queryByText } = renderComponent();
    toggleDefaultRoles();
    const role = queryByText(rolesTableData[5].name);
    expect(role).toBeInTheDocument();
    const moreMenu = queryAllByTestId("actions-cell-menu-icon");
    expect(moreMenu).toHaveLength(6);
  });
  it("should disable 'Add role' CTA if the tenat level manage roles permission is absent", () => {
    renderComponent();
    const button = screen.getAllByTestId("t--acl-page-header-input");
    expect(button[0]).toHaveAttribute("disabled");
  });
});
