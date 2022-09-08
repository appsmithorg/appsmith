import React from "react";
import "@testing-library/jest-dom";
import { render, screen, waitFor } from "test/testUtils";
import userEvent from "@testing-library/user-event";
import {
  ActiveAllGroupsList,
  ActiveAllGroupsProps,
} from "./ActiveAllGroupsList";
import { GroupAddEdit } from "./GroupAddEdit";
import { userGroupTableData } from "./mocks/UserGroupListingMock";
import { createMessage, ACTIVE_ROLES } from "@appsmith/constants/messages";

let container: any = null;

const props: ActiveAllGroupsProps = {
  activeGroups: ["devops_eng_nov", "marketing_nov"],
  allGroups: ["HR_Appsmith", "devops_design", "Administrator", "App Viewer"],
  removedActiveGroups: [],
  addedAllGroups: [],
  onRemoveGroup: jest.fn(),
  onAddGroup: jest.fn(),
};

function renderComponent() {
  return render(<ActiveAllGroupsList {...props} />);
}

describe("<ActiveAllGroupsList />", () => {
  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
  });
  it("is rendered", () => {
    renderComponent();
    const group = screen.queryAllByTestId("t--active-groups");
    expect(group).toHaveLength(1);
  });
  it("should render Active Roles as title by default, if there is no title given", () => {
    renderComponent();
    const title = screen.getByTestId("t--active-groups-title");
    expect(title).toHaveTextContent(createMessage(ACTIVE_ROLES));
  });
  it("should render the given title", () => {
    const { getByTestId } = render(
      <ActiveAllGroupsList {...props} title="Roles assigned to Design" />,
    );
    const title = getByTestId("t--active-groups-title");
    expect(title).toHaveTextContent("Roles assigned to Design");
  });
  it("should list active groups and all groups from the given props", () => {
    const { getAllByTestId } = render(
      <ActiveAllGroupsList {...props} title="Roles assigned to Design" />,
    );
    const activeGroups = getAllByTestId("t--active-group-row");
    props.activeGroups.map((group, index) => {
      expect(activeGroups[index]).toHaveTextContent(group);
    });

    const allGroups = getAllByTestId("t--all-group-row");
    props?.allGroups?.map((group, index) => {
      expect(allGroups[index]).toHaveTextContent(group);
    });
  });
  /*it("should mark group to be removed", () => {
    renderComponent();
    const activeGroups = screen.getAllByTestId("t--active-group-row");
    userEvent.click(activeGroups[0]);
    expect(activeGroups[0]).toHaveClass("removed");
  });
  it("should mark group to be added", () => {
    renderComponent();
    const allGroups = screen.getAllByTestId("t--all-group-row");
    userEvent.click(allGroups[0]);
    expect(allGroups[0]).toHaveClass("added");
  });*/
  it("should highlight search value", async () => {
    const { getAllByTestId } = render(
      <ActiveAllGroupsList
        {...props}
        searchValue="devops"
        title="Roles assigned to Design"
      />,
    );

    await waitFor(() => {
      const searchedActive = getAllByTestId("t--highlighted-text");
      searchedActive.map((searched) => {
        expect(searched).toHaveTextContent("devops");
      });
    });
  });
  it("should search and filter on search", async () => {
    const userGroupAddEditProps = {
      selected: userGroupTableData[1],
      onClone: jest.fn(),
      onDelete: jest.fn(),
      onBack: jest.fn(),
      isLoading: false,
    };
    const { getAllByTestId, getByText } = render(
      <GroupAddEdit {...userGroupAddEditProps} />,
    );
    const searchInput = getAllByTestId("t--acl-search-input");
    const rolesTab = getByText(`Roles`);
    await userEvent.click(rolesTab);
    await userEvent.type(searchInput[0], "devops");

    await waitFor(() => {
      const activeGroups = getAllByTestId("t--active-group-row");
      expect(activeGroups).toHaveLength(1);
      const searchedActive = getAllByTestId("t--highlighted-text");
      expect(searchedActive[0]).toHaveTextContent("devops");
      activeGroups.map((group) => {
        expect(group).not.toHaveTextContent("marketing_nov");
        expect(group).toHaveTextContent("devops");
      });
    });

    await waitFor(() => {
      const allGroups = getAllByTestId("t--all-group-row");
      expect(allGroups).toHaveLength(1);
      const searchedActive = getAllByTestId("t--highlighted-text");
      expect(searchedActive[0]).toHaveTextContent("devops");
      allGroups.map((group) => {
        expect(group).not.toHaveTextContent("Administrator");
        expect(group).toHaveTextContent("devops");
      });
    });
  });
});
