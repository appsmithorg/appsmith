import React from "react";
import "@testing-library/jest-dom";
import { render, screen, waitFor } from "test/testUtils";
import { RoleAddEdit } from "./RoleAddEdit";
import { rolesTableData } from "./mocks/RolesListingMock";
import userEvent from "@testing-library/user-event";
import { response1 } from "./mocks/mockRoleTreeResponse";
import { BaseAclProps, RoleEditProps } from "./types";
import { makeData } from "./RolesTree";
import { MenuItemProps } from "design-system";
import * as selectors from "@appsmith/selectors/aclSelectors";
import { mockGetRolePermissions } from "./mocks/mockSelectors";
import { PERMISSION_TYPE } from "@appsmith/utils/permissionHelpers";

let container: any = null;

const listMenuItems = [
  {
    className: "rename-menu-item",
    icon: "edit-underline",
    text: "Rename",
    label: "rename",
  },
  {
    className: "delete-menu-item",
    icon: "delete-blank",
    onSelect: jest.fn(),
    text: "Delete",
    label: "delete",
  },
];

const props: RoleEditProps = {
  selected: {
    ...rolesTableData[0],
    tabs: response1.tabs,
  },
  onDelete: jest.fn(),
  isLoading: false,
};

function renderComponent() {
  return render(<RoleAddEdit {...props} />);
}

describe("<RoleAddEdit />", () => {
  jest
    .spyOn(selectors, "getRolePermissions")
    .mockImplementation(mockGetRolePermissions as any);
  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
  });
  it("is rendered", () => {
    renderComponent();
    const role = screen.queryAllByTestId("t--role-edit-wrapper");
    expect(role).toHaveLength(1);
  });
  it("should render the selected role name as title", () => {
    renderComponent();
    const title = screen.queryAllByTestId("t--page-title");
    expect(title[0]).toHaveTextContent(props.selected.name);
  });
  it("should list the correct options in the more menu", async () => {
    const { getAllByTestId, getAllByText } = renderComponent();
    const moreMenu = getAllByTestId("t--page-header-actions");
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
  it("should show input box on role name on clicking title", async () => {
    renderComponent();
    let titleEl = document.getElementsByClassName("t--editable-title");
    expect(titleEl[0]).not.toHaveClass("bp3-editable-text-editing");
    await userEvent.click(titleEl[0]);
    titleEl = document.getElementsByClassName("t--editable-title");
    expect(titleEl[0]).toHaveClass("bp3-editable-text-editing");
  });
  it("should show input box on role name on clicking rename menu item", async () => {
    const { getAllByTestId } = renderComponent();
    const moreMenu = getAllByTestId("t--page-header-actions");
    await userEvent.click(moreMenu[0]);
    let titleEl = document.getElementsByClassName("t--editable-title");
    expect(titleEl[0]).not.toHaveClass("bp3-editable-text-editing");
    const renameOption = document.getElementsByClassName("rename-menu-item");
    await userEvent.click(renameOption[0]);
    titleEl = document.getElementsByClassName("t--editable-title");
    expect(titleEl[0]).toHaveClass("bp3-editable-text-editing");
  });
  it("should show input box on role description on clicking edit description menu item", async () => {
    const { getAllByTestId } = renderComponent();
    const moreMenu = getAllByTestId("t--page-header-actions");
    await userEvent.click(moreMenu[0]);
    let titleEl = document.getElementsByClassName("t--editable-description");
    expect(titleEl).toHaveLength(0);
    const renameOption = document.getElementsByClassName(
      "rename-desc-menu-item",
    );
    await userEvent.click(renameOption[0]);
    titleEl = document.getElementsByClassName("t--editable-description");
    expect(titleEl).toHaveLength(1);
    expect(titleEl[0]).toHaveClass("bp3-editable-text-editing");
  });
  it("should show tabs as per data recieved", () => {
    renderComponent();
    const tabs = screen.getAllByRole("tab");
    expect(tabs.length).toEqual(Object.keys(response1.tabs).length);
    for (const index in tabs) {
      expect(tabs[index]).toHaveTextContent(Object.keys(response1.tabs)[index]);
    }
  });
  it("should shows columns as received from backend", () => {
    renderComponent();
    const tabData: any = Object.values(response1.tabs)[0];
    const columns = tabData?.permissions;
    const tableColumns: HTMLElement[] = screen.getAllByRole("columnheader");
    for (const index in columns) {
      expect(tableColumns[parseInt(index) + 1]).toHaveTextContent(
        columns[index],
      );
    }
  });
  it("should search and highlight search results correctly", async () => {
    renderComponent();
    const searchInput = screen.queryAllByTestId("t--acl-search-input");

    const users = screen.queryAllByText("get_top_list");
    expect(users).toHaveLength(0);

    const tabCount = screen.queryAllByTestId("t--tab-count");
    expect(tabCount).toHaveLength(0);

    await userEvent.type(searchInput[0], "chart");
    expect(searchInput[0]).toHaveValue("chart");

    await waitFor(() => {
      const highlighted = screen.getAllByTestId("t--highlighted-text");
      expect(highlighted).toHaveLength(3);
      const tabCount = screen.queryAllByTestId("t--tab-count");
      expect(tabCount).toHaveLength(1);
    });
  });
  it("should select tab on click", async () => {
    renderComponent();
    const tabs = screen.getAllByRole("tab");
    expect(tabs.length).toEqual(Object.keys(response1.tabs).length);
    if (tabs.length > 0) {
      tabs[0].click();
      const selectedTab = document.getElementsByClassName(
        "react-tabs__tab--selected",
      );
      expect(tabs[0]).toEqual(selectedTab[0]);
    }
  });
  it("should open tree on click of row", async () => {
    renderComponent();
    const rightArrows = document.getElementsByName("right-arrow-2");
    const rows = screen.getAllByRole("row");
    rightArrows[0].click();
    const updatedRows = screen.getAllByRole("row");
    expect(updatedRows.length).toEqual(rows.length + 4);
  });
  it("should show hover state using hashtable", async () => {
    const { getAllByTestId, queryAllByTestId } = renderComponent();
    const elId = "633ae5bf174013666db972c2_Create";
    const hoverCheckboxEl = getAllByTestId(elId)?.[0].getElementsByTagName(
      "div",
    );
    const rightArrows = document.getElementsByName("right-arrow-2");
    rightArrows[0].click();
    const hoverEls: HTMLElement[] = [];
    const tabData: any = Object.values(response1.tabs)[0];
    tabData.hoverMap[elId].forEach((item: { id: string; p: string }) => {
      hoverEls.push(...queryAllByTestId(`${item.id}_${item.p}`));
    });
    userEvent.hover(hoverCheckboxEl?.[0]);
    expect(hoverEls?.[0]).toHaveClass("hover-state");
    /* expect(hoverEls[0]).toHaveStyle("opacity: 0.4"); styled-components 5.2.1 should solve this */
  });
  it("should show correct checkbox state", async () => {
    renderComponent();
    const rows = screen.getAllByRole("row");
    const td = rows[1].getElementsByTagName("td");
    const inputs = rows[1].getElementsByTagName("input");
    const tabData: any = Object.values(response1.tabs)[0];
    const data = makeData({
      data: [tabData?.data] || [],
      hoverMap: tabData.hoverMap,
      permissions: tabData.permissions,
    });
    const noCheckboxCount = data[0].permissions.filter((p: BaseAclProps) => p);
    expect(inputs.length).toEqual(
      data[0].permissions.length - noCheckboxCount.length,
    );
    for (let i = 0; i < td.length; i++) {
      if (data[i] === -1) {
        expect(td[i + 1]).not.toContain("input");
      } else if (data[i] === 1) {
        const inputInTd = td[i + 1].getElementsByTagName("input");
        expect(inputInTd[0]).toBeChecked();
      } else if (data[i] === 0) {
        const inputInTd = td[i + 1].getElementsByTagName("input");
        expect(inputInTd[0]).not.toBeChecked();
      } else if (data[i] === 3) {
        const inputInTd = td[i + 1].getElementsByTagName("input");
        expect(inputInTd[0]).toBePartiallyChecked();
      }
    }
  });
  it("should show save bottom bar on changing data", async () => {
    const { queryByText } = renderComponent();
    let saveButton = queryByText("Save Changes");
    expect(saveButton).not.toBeInTheDocument();
    const elId = "633ae5bf174013666db972c2_Create";
    const checkboxEl = document.querySelector(
      `[data-testid="${elId}"] .design-system-checkbox span`,
    ) as HTMLElement;
    await checkboxEl?.click();
    saveButton = queryByText("Save Changes");
    expect(saveButton).toBeInTheDocument();
  });
  it("should hide save bottom bar on clicking clear", async () => {
    const { queryByText } = renderComponent();
    const elId = "633ae5bf174013666db972c2_Create";
    const checkboxEl = document.querySelector(
      `[data-testid="${elId}"] .design-system-checkbox span`,
    ) as HTMLElement;
    await checkboxEl?.click();
    let saveButton = queryByText("Save Changes");
    expect(saveButton).toBeInTheDocument();
    const clearButton = queryByText("Clear");
    expect(clearButton).toBeInTheDocument();
    await clearButton?.click();
    saveButton = queryByText("Save Changes");
    expect(saveButton).not.toBeInTheDocument();
  });
  it("should display only the options which the user is permitted to", async () => {
    jest
      .spyOn(selectors, "getRolePermissions")
      .mockImplementation(() =>
        mockGetRolePermissions([PERMISSION_TYPE.DELETE_PERMISSIONGROUPS]),
      );
    const { queryAllByTestId } = renderComponent();
    const moreMenu = queryAllByTestId("t--page-header-actions");
    expect(moreMenu).toHaveLength(1);
    await userEvent.click(moreMenu[0]);
    const deleteOption = document.getElementsByClassName("delete-menu-item");
    const editOption = document.getElementsByClassName("rename-menu-item");

    expect(deleteOption).toHaveLength(0);
    expect(editOption).toHaveLength(1);
  });
  it("should not display more option if the user doesn't have edit and delete permissions", () => {
    jest
      .spyOn(selectors, "getRolePermissions")
      .mockImplementation(() =>
        mockGetRolePermissions([
          PERMISSION_TYPE.DELETE_PERMISSIONGROUPS,
          PERMISSION_TYPE.MANAGE_PERMISSIONGROUPS,
        ]),
      );
    const { queryAllByTestId } = renderComponent();
    const moreMenu = queryAllByTestId("t--page-header-actions");
    expect(moreMenu).toHaveLength(0);
  });
  it("should not make title editable when user don't have edit permission", () => {
    jest
      .spyOn(selectors, "getRolePermissions")
      .mockImplementation(() =>
        mockGetRolePermissions([PERMISSION_TYPE.MANAGE_PERMISSIONGROUPS]),
      );
    const { queryAllByTestId } = renderComponent();
    const editIcon = queryAllByTestId("t--action-name-edit-icon");
    expect(editIcon).toHaveLength(0);
    const editableTitle = queryAllByTestId("t--editable-title");
    expect(editableTitle).toHaveLength(0);
  });
  /*it("should delete the group when Delete menu item is clicked", async () => {
    const { getAllByTestId, getByText } = renderComponent();
    const moreMenu = getAllByTestId("t--page-header-actions");
    await userEvent.click(moreMenu[0]);
    const deleteOption = document.getElementsByClassName("delete-menu-item");
    expect(deleteOption[0]).toHaveTextContent("Delete");
    expect(deleteOption[0]).not.toHaveTextContent("Are you sure?");
    await userEvent.click(deleteOption[0]);
    const confirmationText = document.getElementsByClassName(
      "delete-menu-item",
    );
    expect(confirmationText[0]).toHaveTextContent("Are you sure?");
    await userEvent.dblClick(deleteOption[0]);
    await waitFor(
      () => {
        expect(window.location.pathname).toEqual("/settings/roles");
        const deletedGroup = screen.queryByText(props.selected.name);
        return expect(deletedGroup).toBeFalsy();
      },
      { timeout: 1000 },
    );
  });*/
});
