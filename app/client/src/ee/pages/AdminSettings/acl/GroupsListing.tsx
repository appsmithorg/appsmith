import React, { useEffect, useState } from "react";
import { useParams, useHistory } from "react-router";
import { connect } from "react-redux";
import { Link } from "react-router-dom";
import styled from "styled-components";
import debounce from "lodash/debounce";
import { Listing } from "./Listing";
import { Toaster, Variant } from "components/ads";
import { HighlightText, MenuItemProps } from "design-system";
import { PageHeader } from "./PageHeader";
import { BottomSpace } from "pages/Settings/components";
import { GroupAddEdit } from "./GroupAddEdit";
import { AclWrapper } from "./components";
import { User } from "./UserListing";
// import uniqueId from "lodash/uniqueId";
import { adminSettingsCategoryUrl } from "RouteBuilder";
import { SettingCategories } from "@appsmith/pages/AdminSettings/config/types";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import {
  // cloneGroup,
  deleteGroup,
  getGroupById,
} from "@appsmith/actions/aclActions";
import {
  createMessage,
  ADD_GROUP,
  GROUP_DELETED,
  // GROUP_CLONED,
  // COPY_OF_GROUP,
  // CLONE_GROUP,
  EDIT_GROUP,
  DELETE_GROUP,
  SEARCH_GROUPS_PLACEHOLDER,
} from "@appsmith/constants/messages";
import { AppState } from "@appsmith/reducers";

const CellContainer = styled.div`
  display: flex;
  align-items: center;
  cursor: pointer;
`;

export type UserGroup = {
  isEditing: boolean;
  isDeleting: boolean;
  rolename: string;
  id: string;
  allRoles: string[];
  activePermissions: string[];
  allUsers: Partial<User>[];
  isNew?: boolean;
};

export type GroupListingProps = {
  deleteGroup: (id: string) => void;
  getAllUserGroups: () => void;
  getGroupById: (id: string) => void;
  groups: UserGroup[];
  selectedGroup: UserGroup;
};

export function GroupListing(props: GroupListingProps) {
  const [data, setData] = useState<UserGroup[]>([]);
  const [searchValue, setSearchValue] = useState("");
  const [selectedUserGroup, setSelectedUserGroup] = useState<any>({});
  const [isNewGroup, setIsNewGroup] = useState(false);
  const history = useHistory();
  const params = useParams() as any;

  const selectedUserGroupId = params?.selected;
  const {
    deleteGroup,
    getAllUserGroups,
    getGroupById,
    groups: userGroups,
    selectedGroup,
  } = props;

  useEffect(() => {
    getAllUserGroups();
  }, []);

  useEffect(() => {
    setSelectedUserGroup(selectedGroup);
  }, [selectedGroup]);

  useEffect(() => {
    if (isNewGroup && params?.selected) {
      setSelectedUserGroup({
        isEditing: false,
        isDeleting: false,
        rolename: "Untitled Group",
        isNew: true,
        id: "10109",
        allRoles: [
          "Administrator",
          "App Viewer",
          "HR_Appsmith",
          "devops_design",
          "devops_eng_nov",
          "marketing_nov",
        ],
        activePermissions: [],
        allUsers: [],
      });
    } else if (selectedUserGroupId) {
      getGroupById(selectedUserGroupId);
      setIsNewGroup(false);
    } else {
      setData(userGroups);
      setIsNewGroup(false);
    }
  }, [userGroups, selectedUserGroupId]);

  const onDeleteHandler = (id: string) => {
    deleteGroup(id);
    const updatedData = data.filter((userGroup) => {
      return userGroup.id !== id;
    });
    setData(updatedData);
    Toaster.show({
      text: createMessage(GROUP_DELETED),
      variant: Variant.success,
    });
  };

  /*const onCloneHandler = (selected: UserGroup) => {
    dispatch(cloneGroup(selected));
    Toaster.show({
      text: createMessage(GROUP_CLONED),
      variant: Variant.success,
    });
  };*/

  const columns = [
    {
      Header: `Groups (${data.length})`,
      accessor: "rolename",
      Cell: function GroupCell(cellProps: any) {
        return (
          <Link
            data-testid="t--usergroup-cell"
            to={adminSettingsCategoryUrl({
              category: SettingCategories.GROUPS_LISTING,
              selected: cellProps.cell.row.original.id,
            })}
          >
            <CellContainer>
              <HighlightText
                highlight={searchValue}
                text={cellProps.cell.row.values.rolename}
              />
            </CellContainer>
          </Link>
        );
      },
    },
  ];

  const listMenuItems: MenuItemProps[] = [
    /*{
      className: "clone-menu-item",
      icon: "duplicate",
      onSelect: (e: React.MouseEvent, id: string) => {
        const selectedUserGroup = data.find((userGroup) => userGroup.id === id);
        selectedUserGroup &&
          onCloneHandler({
            ...selectedUserGroup,
          });
      },
      text: createMessage(CLONE_GROUP),
    },*/
    {
      className: "edit-menu-item",
      icon: "edit-underline",
      onSelect: (e: React.MouseEvent, key: string) => {
        history.push(`/settings/groups/${key}`);
      },
      text: createMessage(EDIT_GROUP),
    },
    {
      label: "delete",
      className: "delete-menu-item",
      icon: "delete-blank",
      onSelect: (e: React.MouseEvent, key: string) => {
        onDeleteHandler(key);
      },
      text: createMessage(DELETE_GROUP),
    },
  ];

  const pageMenuItems: MenuItemProps[] = [
    {
      icon: "book-line",
      className: "documentation-page-menu-item",
      onSelect: () => {
        /*console.log("hello onSelect")*/
      },
      text: "Documentation",
    },
  ];

  const onAddButtonClick = () => {
    setIsNewGroup(true);
    history.push(`/settings/groups/10109`);
  };

  const onSearch = debounce((search: string) => {
    if (search && search.trim().length > 0) {
      setSearchValue(search);
      const results =
        userGroups &&
        userGroups.filter((userGroup) =>
          userGroup.rolename?.toLocaleUpperCase().includes(search),
        );
      setData(results);
    } else {
      setSearchValue("");
      setData(userGroups);
    }
  }, 300);

  return (
    <AclWrapper data-testid="t--group-listing-wrapper">
      {selectedUserGroupId && selectedUserGroup ? (
        <GroupAddEdit
          // onClone={onCloneHandler}
          onDelete={onDeleteHandler}
          selected={selectedUserGroup}
        />
      ) : (
        <>
          <PageHeader
            buttonText={createMessage(ADD_GROUP)}
            onButtonClick={onAddButtonClick}
            onSearch={onSearch}
            pageMenuItems={pageMenuItems}
            searchPlaceholder={createMessage(SEARCH_GROUPS_PLACEHOLDER)}
          />
          <Listing
            columns={columns}
            data={data}
            keyAccessor="id"
            listMenuItems={listMenuItems}
          />
        </>
      )}
      <BottomSpace />
    </AclWrapper>
  );
}

const mapStateToProps = (state: AppState) => {
  return {
    groups: state.acl.groups,
    selectedGroup: state.acl.selectedGroup,
  };
};

const mapDispatchToProps = (dispatch: any) => ({
  getAllUserGroups: () => dispatch({ type: ReduxActionTypes.FETCH_ACL_GROUP }),
  getGroupById: (id: string) => dispatch(getGroupById({ id })),
  deleteGroup: (id: string) => dispatch(deleteGroup(id)),
});

export default connect(mapStateToProps, mapDispatchToProps)(GroupListing);
