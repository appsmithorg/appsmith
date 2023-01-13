import React from "react";
import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "test/testUtils";
import { ActiveAllGroupsList } from "./ActiveAllGroupsList";
import { GroupAddEdit } from "./GroupAddEdit";
import { userGroupTableData } from "./mocks/UserGroupListingMock";
import { createMessage, ACTIVE_ENTITIES } from "@appsmith/constants/messages";
import { ActiveAllGroupsProps, BaseAclProps } from "./types";

let container: any = null;

const props: ActiveAllGroupsProps = {
  activeGroups: [
    {
      id: "1",
      name: "devops_eng_nov",
    },
    {
      id: "2",
      name: "marketing_nov",
    },
  ],
  allGroups: [
    {
      id: "3",
      name: "HR_Appsmith",
    },
    {
      id: "4",
      name: "devops_design",
    },
    {
      id: "5",
      name: "Administrator",
    },
    {
      id: "6",
      name: "App Viewer",
    },
  ],
  entityName: "group",
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
    expect(title).toHaveTextContent(
      createMessage(ACTIVE_ENTITIES, props.entityName),
    );
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
    props.activeGroups.forEach((group: BaseAclProps, index: number) => {
      expect(activeGroups[index]).toHaveTextContent(group.name);
    });

    const allGroups = getAllByTestId("t--all-group-row");
    props?.allGroups?.forEach((group: BaseAclProps, index: number) => {
      expect(allGroups[index]).toHaveTextContent(group.name);
    });
  });
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
      searchedActive.forEach((searched: HTMLElement) => {
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
      isNew: false,
    };
    const { getAllByRole, getAllByTestId } = render(
      <GroupAddEdit {...userGroupAddEditProps} />,
    );
    const searchInput = getAllByTestId("t--acl-search-input");
    const tabs = getAllByRole("tab");
    const rolesTab = tabs[1];
    await fireEvent.click(rolesTab);
    await fireEvent.change(searchInput[0], { target: { value: "devops" } });

    await waitFor(() => {
      const activeGroups = getAllByTestId("t--active-group-row");
      expect(activeGroups).toHaveLength(1);
      const searchedActive = getAllByTestId("t--highlighted-text");
      expect(searchedActive[0]).toHaveTextContent("devops");
      activeGroups.forEach((group: HTMLElement) => {
        expect(group).not.toHaveTextContent("marketing_nov");
        expect(group).toHaveTextContent("devops");
      });
    });

    await waitFor(() => {
      const allGroups = getAllByTestId("t--all-group-row");
      expect(allGroups).toHaveLength(1);
      const searchedActive = getAllByTestId("t--highlighted-text");
      expect(searchedActive[0]).toHaveTextContent("devops");
      allGroups.forEach((group: HTMLElement) => {
        expect(group).not.toHaveTextContent("Administrator");
        expect(group).toHaveTextContent("devops");
      });
    });
  });
});
