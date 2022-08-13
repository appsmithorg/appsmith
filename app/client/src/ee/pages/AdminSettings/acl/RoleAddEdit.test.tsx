import React from "react";
import "@testing-library/jest-dom";
import { render, screen, waitFor } from "test/testUtils";
import { RoleAddEdit, RoleEditProps } from "./RoleAddEdit";
import { rolesTableData } from "./RolesListing";
import { hashtable } from "./RolesTree";
import userEvent from "@testing-library/user-event";
import { response2 } from "./mocks/mockRoleTreeResponse";

let container: any = null;

const searchResultsMock = [
  {
    name: "Application Resources",
    data: [
      {
        id: "query2",
        name: "put_fo_roster",
        permission: [0, 1, 1, 1],
      },
      {
        id: "query6",
        name: "put_force_roster",
        permission: [0, 1, 1, 1],
      },
      {
        id: "query3",
        name: "put_force_roster",
        permission: [0, 1, 1, 1],
      },
      {
        id: "query1",
        name: "put_top_list",
        permission: [0, 1, 1, 1],
      },
    ],
    count: 4,
  },
  {
    name: "Datasources & Queries",
    data: [
      {
        id: "query1",
        name: "put_top_list",
        permission: [0, 1, 1, 1],
      },
    ],
    count: 1,
  },
  {
    name: "Groups & Roles",
    data: [
      {
        id: "query1",
        name: "put_my_list",
        permission: [0, 1, 1, 1],
      },
    ],
    count: 1,
  },
  {
    name: "Others",
    data: [
      {
        id: "query1",
        name: "put_my_list",
        permission: [0, 1, 1, 1],
      },
      {
        id: "query1",
        name: "put_my_list",
        permission: [0, 1, 1, 1],
      },
    ],
    count: 2,
  },
];

const listMenuItems = [
  {
    className: "clone-menu-item",
    icon: "duplicate",
    onSelect: jest.fn(),
    text: "Clone Role",
    label: "clone",
  },
  {
    className: "rename-menu-item",
    icon: "edit-underline",
    text: "Rename Role",
    label: "rename",
  },
  {
    className: "delete-menu-item",
    icon: "delete-blank",
    onSelect: jest.fn(),
    text: "Delete Role",
    label: "delete",
  },
];

const props: RoleEditProps = {
  selected: rolesTableData[0],
  onClone: jest.fn(),
  onDelete: jest.fn(),
};

function renderComponent() {
  return render(<RoleAddEdit {...props} />);
}

describe("<RoleAddEdit />", () => {
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
    const title = screen.queryAllByTestId("t--editatble-title");
    expect(title[0]).toHaveTextContent(props.selected.permissionName);
  });
  it("should list the correct options in the more menu", async () => {
    const { getAllByTestId, getAllByText } = renderComponent();
    const moreMenu = getAllByTestId("t--page-header-actions");
    await userEvent.click(moreMenu[0]);
    const options = listMenuItems.map((menuItem) => menuItem.text);
    const menuElements = options.map((option) => getAllByText(option)).flat();
    options.map((option, index) => {
      expect(menuElements[index]).toHaveTextContent(option);
    });
  });
  it("should show input box on group name on double clicking title", async () => {
    const { getAllByTestId } = renderComponent();
    const moreMenu = getAllByTestId("t--page-header-actions");
    await userEvent.click(moreMenu[0]);
    let titleEl = document.getElementsByClassName("t--editable-title");
    expect(titleEl[0]).not.toContain("input");
    await userEvent.dblClick(titleEl[0]);
    titleEl = document.getElementsByClassName("t--editable-title");
    expect(titleEl[0]).toContainHTML("input");
  });
  it("should show tabs as per data recieved", () => {
    renderComponent();
    const tabs = screen.getAllByRole("tab");
    expect(tabs.length).toEqual(response2.length);
    for (const index in tabs) {
      expect(tabs[index]).toHaveTextContent(response2[index].name);
    }
  });
  it("should shows columns as received from backend", () => {
    renderComponent();
    const columns: any[] = response2[0].permission;
    const tableColumns: any[] = screen.getAllByRole("columnheader");
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

    await userEvent.type(searchInput[0], "put");
    expect(searchInput[0]).toHaveValue("put");

    const searchResultsCounts = searchResultsMock.map((result) =>
      result.count.toString(),
    );

    await waitFor(() => {
      const searched = screen.queryAllByText("put");
      const highlighted = screen.getAllByTestId("t--highlighted-text");
      expect(searched).toHaveLength(searchResultsMock[0].count);
      expect(highlighted).toHaveLength(searchResultsMock[0].count);
      const tabCount = screen.queryAllByTestId("t--tab-count");
      expect(tabCount).toHaveLength(response2.length);
      expect(tabCount.map((tab) => tab.textContent)).toEqual(
        searchResultsCounts,
      );
    });
  });
  it("should select tab on click", async () => {
    renderComponent();
    const tabs = screen.getAllByRole("tab");
    expect(tabs.length).toEqual(response2.length);
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
    expect(updatedRows.length).toEqual(rows.length + 1);
  });
  it("should show correct checkbox state", async () => {
    renderComponent();
    const rows = screen.getAllByRole("row");
    const td = rows[1].getElementsByTagName("td");
    const inputs = rows[1].getElementsByTagName("input");
    const data = response2[0].data[0].permission;
    const noCheckboxCount = response2[0].data[0].permission.filter(
      (p) => p === 0,
    );
    expect(inputs.length).toEqual(data.length - noCheckboxCount.length);
    for (let i = 0; i < td.length; i++) {
      if (data[i] === 0) {
        expect(td[i + 1]).not.toContain("input");
      } else if (data[i] === 1) {
        const inputInTd = td[i + 1].getElementsByTagName("input");
        expect(inputInTd[0]).toBeChecked();
      } else if (data[i] === 2) {
        const inputInTd = td[i + 1].getElementsByTagName("input");
        expect(inputInTd[0]).not.toBeChecked();
      } else if (data[i] === 3) {
        const inputInTd = td[i + 1].getElementsByTagName("input");
        expect(inputInTd[0]).toBePartiallyChecked();
      }
    }
  });
  it("should show hover state using hashtable", async () => {
    renderComponent();
    const elId = response2[0].data[0].id + "-" + response2[0].permission[0];
    const hoverCheckboxEl = screen.getAllByTestId(elId);
    userEvent.hover(hoverCheckboxEl[0]);
    const hoverEls: any[] = [];
    hashtable[elId].map((item) => {
      hoverEls.push(
        ...screen.queryAllByTestId(item.id + "-" + item.permission),
      );
    });
    expect(hoverEls[0]).toHaveClass("hover-state");
    // expect(hoverEls[0]).toHaveStyle("opacity: 0.4"); styled-components 5.2.1 should solve this
  });

  // it("should update data on clicking a checkbox as expected", async () => {});
  // it("should save data on save button click", async () => {});
  /*it("should clone the group when clone menu item is clicked", async () => {
    const { getAllByTestId } = renderComponent();
    const moreMenu = getAllByTestId("t--page-header-actions");
    await userEvent.click(moreMenu[0]);
    const cloneOption = document.getElementsByClassName("clone-menu-item");
    await userEvent.click(cloneOption[0]);
    await waitFor(
      () => {
        expect(window.location.pathname).toEqual("/settings/roles");
        const clonedGroup = screen.queryByText(
          `Copy of ${props.selected.permissionName}`,
        );
        return expect(clonedGroup).toBeTruthy();
      },
      { timeout: 1000 },
    );
  });*/
  it("should show input box on group name on clicking rename menu item", async () => {
    const { getAllByTestId } = renderComponent();
    const moreMenu = getAllByTestId("t--page-header-actions");
    await userEvent.click(moreMenu[0]);
    const cloneOption = document.getElementsByClassName("rename-menu-item");
    let titleEl = document.getElementsByClassName("t--editable-title");
    expect(titleEl[0]).not.toContain("input");
    await userEvent.click(cloneOption[0]);
    titleEl = document.getElementsByClassName("t--editable-title");
    expect(titleEl[0]).toContainHTML("input");
  });
  /*it("should delete the group when Delete menu item is clicked", async () => {
    const { getAllByTestId, getByText } = renderComponent();
    const moreMenu = getAllByTestId("t--page-header-actions");
    await userEvent.click(moreMenu[0]);
    const deleteOption = document.getElementsByClassName("delete-menu-item");
    expect(deleteOption[0]).toHaveTextContent("Delete Role");
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
        const deletedGroup = screen.queryByText(props.selected.permissionName);
        return expect(deletedGroup).toBeFalsy();
      },
      { timeout: 1000 },
    );
  });*/
});
