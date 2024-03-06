import React, { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useHistory, useLocation, useParams } from "react-router-dom";
import styled from "styled-components";
import debounce from "lodash/debounce";
import { Listing } from "./Listing";
import { HighlightText } from "design-system-old";
import { PageHeader } from "./PageHeader";
import {
  BottomSpace,
  LoaderContainer,
  NoUnderLineLink,
} from "pages/AdminSettings/components";
import { UserEdit } from "./UserEdit";
import {
  AclWrapper,
  EmptyDataState,
  EmptySearchResult,
  INVITE_USERS_TAB_ID,
} from "./components";
import InviteUsersForm from "@appsmith/pages/workspace/InviteUsersForm";
import { adminSettingsCategoryUrl } from "@appsmith/RouteBuilder";
import { SettingCategories } from "@appsmith/pages/AdminSettings/config/types";
import {
  deleteAclUser,
  fetchAclUsers,
  fetchNextAclUsers,
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
  getAllAclUsers,
  getGroupsForInvite,
  getRolesForInvite,
  getSelectedUser,
  selectHasMoreUsers,
  selectTotalAclUsers,
} from "@appsmith/selectors/aclSelectors";
import type { BaseAclProps, MenuItemProps, UserProps } from "./types";
import { ListingType } from "./types";
import { getCurrentUser } from "selectors/usersSelectors";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { USER_PHOTO_ASSET_URL } from "constants/userConstants";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
  Tab,
  TabPanel,
  Tabs,
  TabsList,
  Text,
  Link as AdsLink,
  Spinner,
  Icon,
} from "design-system";
import { AvatarComponent } from "pages/common/AvatarComponent";

export const CellContainer = styled.div`
  display: flex;
  align-items: center;
  gap: var(--ads-v2-spaces-3);

  &.user-email-column > span:nth-child(2) {
    text-decoration: underline;
    text-underline-offset: var(--ads-v2-spaces-2);
    text-decoration-color: var(--ads-v2-color-border);

    &:hover {
      text-decoration-color: var(--ads-v2-color-border-emphasis);
    }
  }

  .user-icons {
    cursor: initial;
  }
`;

export const GroupWrapper = styled.div``;

export const MoreGroups = styled(AdsLink)`
  margin-top: 8px;
  // TODO: On user listing screen, this text is not differentiable from the text above due to font size
  > span {
    font-size: 12px;
  }
`;

export const AllGroups = styled.div`
  display: flex;
  flex-direction: column;
  color: var(--ads-v2-color-fg);
  > p {
    margin: 8px 0;

    &:first-child {
      margin-top: 0;
    }

    &:last-child {
      margin-bottom: 0;
    }
  }
`;

export const ShowLess = styled(AdsLink)`
  margin-top: 8px;
  // TODO: On user listing screen, this text is not differentiable from the text above due to font size
  > span {
    font-size: 12px;
  }
`;

export const StyledText = styled(Text)`
  margin-bottom: 1rem;
`;

export function UserListing() {
  const history = useHistory();
  const params = useParams() as any;
  const dispatch = useDispatch();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const provisionedQueryParam = queryParams.get("provisioned");

  const aclUsers = useSelector(getAllAclUsers);
  const selUser = useSelector(getSelectedUser);
  const isLoading = useSelector(getAclIsLoading);
  const inviteViaRoles = useSelector(getRolesForInvite);
  const inviteViaGroups = useSelector(getGroupsForInvite);
  const [selectedUser, setSelectedUser] = useState<UserProps | null>(null);
  const [activeTab, setActiveTab] = useState<string>(
    INVITE_USERS_TAB_ID.VIA_ROLES,
  );
  const [searchValue, setSearchValue] = useState("");
  const [showModal, setShowModal] = useState(false);

  const selectedUserId = params?.selected;

  const user = useSelector(getCurrentUser);

  const canInviteUser = user?.isSuperUser;
  const hasMore = useSelector(selectHasMoreUsers);

  useEffect(() => {
    setSelectedUser(selUser);
  }, [selUser]);

  useEffect(() => {
    if (selectedUserId && selectedUser?.id !== selectedUserId) {
      setSelectedUser(null);
      dispatch(getUserById({ id: selectedUserId }));
    } else if (!selectedUserId) {
      dispatch(
        fetchAclUsers(
          provisionedQueryParam
            ? {
                provisioned: provisionedQueryParam,
              }
            : {},
        ),
      );
    }
  }, [selectedUserId]);

  useEffect(() => {
    return () => {
      dispatch({ type: ReduxActionTypes.RESET_USERS_DATA });
    };
  }, []);

  const onFormSubmitHandler = ({ ...values }) => {
    if (activeTab === INVITE_USERS_TAB_ID.VIA_GROUPS) {
      const usernames = values.users ? values.users.split(",") : [];
      const groupIds = values.options.map((option: any) => option.value);
      const groupsAdded = values.options.map((option: any) => ({
        id: option.value,
        name: option.label,
      }));
      AnalyticsUtil.logEvent("GAC_INVITE_USER_CLICK", {
        origin: createMessage(EVENT_USER_INVITE),
        groups: groupsAdded.map((group: any) => group.id),
        roles: [],
        numberOfUsersInvited: usernames.length,
      });
      dispatch(inviteUsersViaGroups(usernames, groupIds, activeTab));
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
        roles: rolesAdded.map((role: any) => role.id),
        numberOfUsersInvited: users.length,
      });
      dispatch(inviteUsersViaRoles(users, rolesAdded, activeTab));
    }
    setShowModal(false);
  };

  const totalUsers = useSelector(selectTotalAclUsers);

  const columns = [
    {
      Header: `Users (${totalUsers})`,
      accessor: "username",
      disableSortBy: true,
      Cell: function UserCell(cellProps: any) {
        const { username } = cellProps.cell.row.values;
        const { id, isProvisioned, photoId } = cellProps.cell.row.original;
        return (
          <NoUnderLineLink
            className="user-email-link"
            data-testid="acl-user-listing-link"
            onClick={() =>
              AnalyticsUtil.logEvent("GAC_USER_CLICK", {
                origin: createMessage(EVENT_USERS_PAGE),
                clicked_user_id: id,
              })
            }
            target="_self"
            to={adminSettingsCategoryUrl({
              category: SettingCategories.USER_LISTING,
              selected: id,
            })}
          >
            <CellContainer
              className="user-email-column"
              data-testid="user-listing-userCell"
            >
              <AvatarComponent
                className="user-icons"
                label="user-avatar"
                size="sm"
                source={
                  photoId
                    ? `/api/${USER_PHOTO_ASSET_URL}/${photoId}`
                    : undefined
                }
                userName={username}
              />
              <HighlightText highlight={searchValue} text={username} />
              {isProvisioned && (
                <Icon data-tesid="t--provisioned-resource" name="link-unlink" />
              )}
            </CellContainer>
          </NoUnderLineLink>
        );
      },
    },
    {
      Header: "Roles",
      accessor: "roles",
      disableSortBy: true,
      Cell: function RoleCell(cellProps: any) {
        const [showAllGroups, setShowAllGroups] = useState(false);
        const values = cellProps.cell.row.values;

        const onClickShowMore = () => {
          setShowAllGroups(true);
        };

        const onClickShowLess = () => {
          setShowAllGroups(false);
        };

        return (
          <CellContainer data-testid="user-listing-rolesCell">
            {showAllGroups ? (
              <AllGroups>
                {values.roles?.map((group: BaseAclProps) => (
                  <Text key={group.id} renderAs="p">
                    {group.name}
                  </Text>
                ))}
                <ShowLess
                  data-testid="t--show-less"
                  kind="secondary"
                  onClick={onClickShowLess}
                >
                  {createMessage(SHOW_LESS_GROUPS)}
                </ShowLess>
              </AllGroups>
            ) : (
              <GroupWrapper>
                <Text renderAs="span">{values.roles?.[0]?.name}</Text>
                {values.roles?.[0]?.name.length < 40 &&
                values.roles?.length > 1 ? (
                  <>
                    <Text renderAs="span">, {values.roles?.[1]?.name}</Text>
                    {values.roles?.length > 2 && (
                      <MoreGroups
                        data-testid="t--show-more"
                        kind="secondary"
                        onClick={onClickShowMore}
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
                      kind="secondary"
                      onClick={onClickShowMore}
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
      disableSortBy: true,
      Cell: function GroupCell(cellProps: any) {
        const [showAllGroups, setShowAllGroups] = useState(false);
        const values = cellProps.cell.row.values;

        const onClickShowMore = () => {
          setShowAllGroups(true);
        };

        const onClickShowLess = () => {
          setShowAllGroups(false);
        };

        return (
          <CellContainer data-testid="user-listing-groupCell">
            {showAllGroups ? (
              <AllGroups>
                {values.groups?.map((group: BaseAclProps) => (
                  <Text key={group.id} renderAs="p">
                    {group.name}
                  </Text>
                ))}
                <ShowLess
                  data-testid="t--show-less"
                  kind="secondary"
                  onClick={onClickShowLess}
                >
                  {createMessage(SHOW_LESS_GROUPS)}
                </ShowLess>
              </AllGroups>
            ) : (
              <GroupWrapper>
                <Text renderAs="span">{values.groups?.[0]?.name}</Text>
                {values.groups?.[0]?.name.length < 40 &&
                values.groups?.length > 1 ? (
                  <>
                    <Text renderAs="span">, {values.groups?.[1]?.name}</Text>
                    {values.groups?.length > 2 && (
                      <MoreGroups
                        data-testid="t--show-more"
                        kind="secondary"
                        onClick={onClickShowMore}
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
                      kind="secondary"
                      onClick={onClickShowMore}
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
      icon: "pencil-line",
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
      icon: "delete-bin-line",
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
      options: inviteViaRoles.map((role: BaseAclProps) => ({
        value: role.name,
        key: role.id,
      })),
      customProps: {
        isAclFlow: true,
        dropdownPlaceholder: "Select role(s)",
        isMultiSelectDropdown: true,
        onSubmitHandler: onFormSubmitHandler,
      },
    },
    {
      key: INVITE_USERS_TAB_ID.VIA_GROUPS,
      title: "via groups",
      options: inviteViaGroups.map((group: BaseAclProps) => ({
        value: group.name,
        key: group.id,
      })),
      customProps: {
        isAclFlow: true,
        dropdownPlaceholder: "Select group(s)",
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
    if (searchValue?.trim() !== search?.trim()) {
      dispatch(
        fetchAclUsers({
          ...(search?.trim() ? { searchTerm: search.trim() } : {}),
          ...(provisionedQueryParam
            ? {
                provisioned: provisionedQueryParam,
              }
            : {}),
        }),
      );
    }
    setSearchValue(search);
  }, 300);

  const onDeleteHandler = (userId: string) => {
    dispatch(deleteAclUser({ id: userId }));
  };

  const loadMore = useCallback(() => {
    if (!hasMore) return;

    dispatch(
      fetchNextAclUsers({
        startIndex: aclUsers.length,
        ...(searchValue?.trim() ? { searchTerm: searchValue.trim() } : {}),
        ...(provisionedQueryParam
          ? {
              provisioned: provisionedQueryParam,
            }
          : {}),
      }),
    );
  }, [hasMore, aclUsers.length, provisionedQueryParam, searchValue]);

  return (
    <AclWrapper data-testid="user-listing-wrapper">
      {selectedUserId ? (
        selectedUser ? (
          <UserEdit
            data-testid="acl-user-edit"
            isLoading={isLoading}
            onDelete={onDeleteHandler}
            searchPlaceholder="Search"
            selectedUser={selectedUser}
          />
        ) : (
          <LoaderContainer>
            <Spinner size="lg" />
          </LoaderContainer>
        )
      ) : (
        <>
          <PageHeader
            buttonText="Add users"
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
            data={aclUsers}
            data-testid="acl-user-listing"
            emptyState={
              searchValue ? (
                <EmptySearchResult />
              ) : (
                <EmptyDataState page="users" />
              )
            }
            hasMore={hasMore}
            infiniteScroll
            isLoading={isLoading}
            keyAccessor="id"
            listMenuItems={listMenuItems}
            listingType={ListingType.USERS}
            loadMore={loadMore}
          />
          <Modal
            onOpenChange={(isOpen) => setShowModal(isOpen)}
            open={showModal}
          >
            <ModalContent
              data-testid="t--dialog-component"
              style={{ width: "640px" }}
            >
              <ModalHeader>{createMessage(ACL_INVITE_MODAL_TITLE)}</ModalHeader>
              <ModalBody>
                <StyledText renderAs="p">
                  {createMessage(ACL_INVITE_MODAL_MESSAGE)}
                </StyledText>
                <Tabs
                  onValueChange={(value) => setActiveTab(value)}
                  value={activeTab}
                >
                  <TabsList>
                    {tabs.map((tab) => (
                      <Tab
                        data-testid={`t--tab-${tab.key}`}
                        key={tab.key}
                        value={tab.key}
                      >
                        {tab.title}
                      </Tab>
                    ))}
                  </TabsList>
                  {tabs.map((tab) => (
                    <TabPanel key={tab.key} value={tab.key}>
                      <InviteUsersForm isMultiSelectDropdown {...tab} />
                    </TabPanel>
                  ))}
                </Tabs>
              </ModalBody>
            </ModalContent>
          </Modal>
        </>
      )}
      <BottomSpace />
    </AclWrapper>
  );
}
