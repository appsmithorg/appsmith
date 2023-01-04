import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useHistory, useParams } from "react-router-dom";
import styled from "styled-components";
import debounce from "lodash/debounce";
import { Listing } from "./Listing";
import ProfileImage from "pages/common/ProfileImage";
import { HighlightText, MenuItemProps } from "design-system";
import { PageHeader } from "./PageHeader";
import { BottomSpace } from "pages/Settings/components";
import { UserEdit } from "./UserEdit";
import {
  AclWrapper,
  EmptyDataState,
  EmptySearchResult,
  INVITE_USERS_TAB_ID,
} from "./components";
import FormDialogComponent from "components/editorComponents/form/FormDialogComponent";
import WorkspaceInviteUsersForm from "@appsmith/pages/workspace/WorkspaceInviteUsersForm";
import { adminSettingsCategoryUrl } from "RouteBuilder";
import { SettingCategories } from "@appsmith/pages/AdminSettings/config/types";
import {
  deleteAclUser,
  getUserById,
  inviteUsersViaGroups,
  inviteUsersViaRoles,
} from "@appsmith/actions/aclActions";
import {
  ACL_INVITE_MODAL_MESSAGE,
  ACL_INVITE_MODAL_TITLE,
  createMessage,
  ACL_DELETE,
  SHOW_LESS_GROUPS,
  SHOW_MORE_GROUPS,
  SEARCH_USERS_PLACEHOLDER,
  EVENT_USER_INVITE,
  EVENT_USERS_PAGE,
} from "@appsmith/constants/messages";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import {
  getAclIsLoading,
  getAclIsEditing,
  getAllAclUsers,
  getGroupsForInvite,
  getRolesForInvite,
  getSelectedUser,
} from "@appsmith/selectors/aclSelectors";
import { BaseAclProps, ListingType, UserProps } from "./types";
import { getCurrentUser } from "selectors/usersSelectors";
import AnalyticsUtil from "utils/AnalyticsUtil";

export const CellContainer = styled.div`
  display: flex;
  align-items: baseline;

  &.user-email-column > span {
    text-decoration: underline;
  }

  .user-icons {
    margin-right 8px;
    cursor: initial;
  }
`;

export const GroupWrapper = styled.div``;

export const MoreGroups = styled.div`
  font-size: 12px;
  line-height: 16px;
  color: var(--appsmith-color-black-700);
  margin-top: 8px;
  &:hover {
    cursor: pointer;
    text-decoration: underline;
  }
`;

export const AllGroups = styled.div`
  display: flex;
  flex-direction: column;
  > div {
    margin: 8px 0;

    &:first-child {
      margin-top: 0;
    }

    &:last-child {
      margin-bottom: 0;
    }
  }
`;

export const ShowLess = styled.div`
  font-size: 12px;
  line-height: 16px;
  color: var(--appsmith-color-black-700);
  &:hover {
    cursor: pointer;
    text-decoration: underline;
  }
`;

export function UserListing() {
  const history = useHistory();
  const params = useParams() as any;
  const dispatch = useDispatch();

  const aclUsers = useSelector(getAllAclUsers);
  const selectedUser = useSelector(getSelectedUser);
  const isLoading = useSelector(getAclIsLoading);
  const isEditing = useSelector(getAclIsEditing);
  const inviteViaRoles = useSelector(getRolesForInvite);
  const inviteViaGroups = useSelector(getGroupsForInvite);

  const [data, setData] = useState<UserProps[]>([]);
  const [searchValue, setSearchValue] = useState("");
  const [showModal, setShowModal] = useState(false);

  const selectedUserId = params?.selected;

  const user = useSelector(getCurrentUser);

  const canInviteUser = user?.isSuperUser;

  useEffect(() => {
    if (searchValue) {
      onSearch(searchValue);
    } else {
      setData(aclUsers);
    }
  }, [aclUsers]);

  useEffect(() => {
    if (selectedUserId && selectedUser?.id !== selectedUserId) {
      dispatch(getUserById({ id: selectedUserId }));
    } else if (!selectedUserId) {
      dispatch({ type: ReduxActionTypes.FETCH_ACL_USERS });
    }
  }, [selectedUserId]);

  useEffect(() => {
    return () => {
      dispatch({ type: ReduxActionTypes.RESET_USERS_DATA });
    };
  }, []);

  const onFormSubmitHandler = ({ ...values }) => {
    if (values.selectedTab === INVITE_USERS_TAB_ID.VIA_GROUPS) {
      const usernames = values.users ? values.users.split(",") : [];
      const groupIds = values.options.map((option: any) => option.value);
      const groupsAdded = values.options.map((option: any) => ({
        id: option.value,
        name: option.label,
      }));
      AnalyticsUtil.logEvent("GAC_INVITE_USER_CLICK", {
        origin: createMessage(EVENT_USER_INVITE),
        groups: groupsAdded,
        roles: [],
        numberOfUsersInvited: usernames.length,
      });
      dispatch(inviteUsersViaGroups(usernames, groupIds, values.selectedTab));
    } else {
      const users = values.users
        ? values.users.split(",").map((user: string) => ({
            username: user,
          }))
        : [];
      const rolesAdded = values.options.map((option: any) => ({
        id: option.value,
        name: option.label,
      }));
      AnalyticsUtil.logEvent("GAC_INVITE_USER_CLICK", {
        origin: createMessage(EVENT_USER_INVITE),
        groups: [],
        roles: rolesAdded,
        numberOfUsersInvited: users.length,
      });
      dispatch(inviteUsersViaRoles(users, rolesAdded, values.selectedTab));
    }
    setShowModal(false);
  };

  const columns = [
    {
      Header: `Users (${data.length})`,
      accessor: "username",
      Cell: function UserCell(cellProps: any) {
        const { username } = cellProps.cell.row.values;
        return (
          <Link
            data-testid="acl-user-listing-link"
            onClick={() =>
              AnalyticsUtil.logEvent("GAC_USER_CLICK", {
                origin: createMessage(EVENT_USERS_PAGE),
                email: username,
              })
            }
            to={adminSettingsCategoryUrl({
              category: SettingCategories.USER_LISTING,
              selected: cellProps.cell.row.original.id,
            })}
          >
            <CellContainer
              className="user-email-column"
              data-testid="user-listing-userCell"
            >
              <ProfileImage
                className="user-icons"
                size={20}
                source={`/api/v1/users/photo/${username}`}
                userName={username}
              />
              <HighlightText highlight={searchValue} text={username} />
            </CellContainer>
          </Link>
        );
      },
    },
    {
      Header: "Roles",
      accessor: "roles",
      Cell: function RoleCell(cellProps: any) {
        const [showAllGroups, setShowAllGroups] = useState(false);
        const values = cellProps.cell.row.values;
        return (
          <CellContainer data-testid="user-listing-rolesCell">
            {showAllGroups ? (
              <AllGroups>
                {values.roles?.map((group: BaseAclProps) => (
                  <div key={group.id}>{group.name}</div>
                ))}
                <ShowLess
                  data-testid="t--show-less"
                  onClick={() => setShowAllGroups(false)}
                >
                  {createMessage(SHOW_LESS_GROUPS)}
                </ShowLess>
              </AllGroups>
            ) : (
              <GroupWrapper>
                {values.roles?.[0]?.name}
                {values.roles?.[0]?.name.length < 40 &&
                values.roles?.length > 1 ? (
                  <>
                    , {values.roles?.[1]?.name}
                    {values.roles?.length > 2 && (
                      <MoreGroups
                        data-testid="t--show-more"
                        onClick={() => setShowAllGroups(true)}
                      >
                        {createMessage(
                          SHOW_MORE_GROUPS,
                          values.roles?.length - 2,
                        )}
                      </MoreGroups>
                    )}
                  </>
                ) : (
                  values.roles?.length > 1 && (
                    <MoreGroups
                      data-testid="t--show-more"
                      onClick={() => setShowAllGroups(true)}
                    >
                      {createMessage(
                        SHOW_MORE_GROUPS,
                        values.roles?.length - 1,
                      )}
                    </MoreGroups>
                  )
                )}
              </GroupWrapper>
            )}
          </CellContainer>
        );
      },
    },
    {
      Header: "Groups",
      accessor: "groups",
      Cell: function GroupCell(cellProps: any) {
        const [showAllGroups, setShowAllGroups] = useState(false);
        const values = cellProps.cell.row.values;
        return (
          <CellContainer data-testid="user-listing-groupCell">
            {showAllGroups ? (
              <AllGroups>
                {values.groups?.map((group: BaseAclProps) => (
                  <div key={group.id}>{group.name}</div>
                ))}
                <ShowLess
                  data-testid="t--show-less"
                  onClick={() => setShowAllGroups(false)}
                >
                  {createMessage(SHOW_LESS_GROUPS)}
                </ShowLess>
              </AllGroups>
            ) : (
              <GroupWrapper>
                {values.groups?.[0]?.name}
                {values.groups?.[0]?.name.length < 40 &&
                values.groups?.length > 1 ? (
                  <>
                    , {values.groups?.[1]?.name}
                    {values.groups?.length > 2 && (
                      <MoreGroups
                        data-testid="t--show-more"
                        onClick={() => setShowAllGroups(true)}
                      >
                        {createMessage(
                          SHOW_MORE_GROUPS,
                          values.groups?.length - 2,
                        )}
                      </MoreGroups>
                    )}
                  </>
                ) : (
                  values.groups?.length > 1 && (
                    <MoreGroups
                      data-testid="t--show-more"
                      onClick={() => setShowAllGroups(true)}
                    >
                      {createMessage(
                        SHOW_MORE_GROUPS,
                        values.groups?.length - 1,
                      )}
                    </MoreGroups>
                  )
                )}
              </GroupWrapper>
            )}
          </CellContainer>
        );
      },
    },
  ];

  const listMenuItems: MenuItemProps[] = [
    {
      label: "edit",
      className: "edit-menu-item",
      icon: "edit-underline",
      onSelect: (e: React.MouseEvent, id: string) => {
        if (id) {
          history.push(`/settings/users/${id}`);
        }
      },
      text: "Edit",
    },
    {
      label: "delete",
      className: "delete-menu-item",
      icon: "delete-blank",
      onSelect: (e: React.MouseEvent, key: string) => {
        onDeleteHandler(key);
      },
      text: createMessage(ACL_DELETE),
    },
  ];

  const pageMenuItems: MenuItemProps[] = [
    {
      icon: "book-line",
      className: "documentation-page-menu-item",
      onSelect: () => {
        window.open(
          "https://docs.appsmith.com/advanced-concepts/access-control/granular-access-control#users",
          "_blank",
        );
      },
      text: "Documentation",
    },
  ];

  const tabs = [
    {
      key: INVITE_USERS_TAB_ID.VIA_ROLES,
      title: "via roles",
      component: WorkspaceInviteUsersForm,
      options: inviteViaRoles.map((role: BaseAclProps) => ({
        label: role.name,
        value: role.id,
        id: role.id,
      })),
      dropdownPlaceholder: "Select a role",
      dropdownMaxHeight: "240px",
      customProps: {
        isAclFlow: true,
        disableEmailSetup: true,
        disableManageUsers: true,
        disableUserList: true,
        isMultiSelectDropdown: true,
        onSubmitHandler: onFormSubmitHandler,
      },
    },
    {
      key: INVITE_USERS_TAB_ID.VIA_GROUPS,
      title: "via groups",
      component: WorkspaceInviteUsersForm,
      options: inviteViaGroups.map((group: BaseAclProps) => ({
        label: group.name,
        value: group.id,
        id: group.id,
      })),
      dropdownPlaceholder: "Select a group",
      dropdownMaxHeight: "240px",
      customProps: {
        isAclFlow: true,
        disableEmailSetup: true,
        disableManageUsers: true,
        disableUserList: true,
        isMultiSelectDropdown: true,
        onSubmitHandler: onFormSubmitHandler,
      },
    },
  ];

  const onButtonClick = () => {
    setShowModal(true);
    AnalyticsUtil.logEvent("GAC_ADD_USER_CLICK", {
      origin: createMessage(EVENT_USERS_PAGE),
    });
    dispatch({
      type: ReduxActionTypes.FETCH_ROLES_GROUPS_FOR_INVITE,
    });
  };

  const onSearch = debounce((search: string) => {
    if (search && search.trim().length > 0) {
      setSearchValue(search);
      const results =
        aclUsers &&
        aclUsers.filter((user: UserProps) =>
          user.username?.toLocaleUpperCase().includes(search),
        );
      setData(results);
    } else {
      setSearchValue("");
      setData(aclUsers);
    }
  }, 300);

  const onDeleteHandler = (userId: string) => {
    dispatch(deleteAclUser({ id: userId }));
    const updatedData = data.filter((user) => {
      return user.id !== userId;
    });
    setData(updatedData);
  };

  return (
    <AclWrapper data-testid="user-listing-wrapper">
      {selectedUserId && selectedUser ? (
        <UserEdit
          data-testid="acl-user-edit"
          isEditing={isEditing}
          isLoading={isLoading}
          onDelete={onDeleteHandler}
          searchPlaceholder="Search"
          selectedUser={selectedUser}
        />
      ) : (
        <>
          <PageHeader
            buttonText="Add Users"
            data-testid="acl-user-listing-pageheader"
            disableButton={!canInviteUser}
            onButtonClick={onButtonClick}
            onSearch={onSearch}
            pageMenuItems={pageMenuItems}
            searchPlaceholder={createMessage(SEARCH_USERS_PLACEHOLDER)}
            searchValue={searchValue}
          />
          <Listing
            columns={columns}
            data={data}
            data-testid="acl-user-listing"
            emptyState={
              searchValue ? (
                <EmptySearchResult />
              ) : (
                <EmptyDataState page="users" />
              )
            }
            isLoading={isLoading}
            keyAccessor="id"
            listMenuItems={listMenuItems}
            listingType={ListingType.USERS}
          />
          <FormDialogComponent
            Form={WorkspaceInviteUsersForm}
            canOutsideClickClose
            data-testid="acl-user-listing-form"
            isOpen={showModal}
            message={createMessage(ACL_INVITE_MODAL_MESSAGE)}
            onClose={() => setShowModal(false)}
            tabs={tabs}
            title={createMessage(ACL_INVITE_MODAL_TITLE)}
            trigger
          />
        </>
      )}
      <BottomSpace />
    </AclWrapper>
  );
}
