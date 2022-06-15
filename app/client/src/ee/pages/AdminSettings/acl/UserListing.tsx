import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Link, useHistory, useParams } from "react-router-dom";
import styled from "styled-components";
import debounce from "lodash/debounce";
import { getCurrentUser } from "selectors/usersSelectors";
// import { OrgUser } from "constants/orgConstants";
// import { getAllUsers } from "selectors/organizationSelectors";
// import { fetchUsersForOrg, fetchRolesForOrg } from "actions/orgActions";
import { Listing } from "./Listing";
import ProfileImage from "pages/common/ProfileImage";
import { MenuItemProps } from "components/ads";
import { PageHeader } from "./PageHeader";
import { BottomSpace } from "pages/Settings/components";
import { HighlightText } from "./helpers/HighlightText";
import { UserEdit } from "./UserEdit";
import { AclWrapper } from "./components";
import FormDialogComponent from "components/editorComponents/form/FormDialogComponent";
import OrgInviteUsersForm from "pages/organization/OrgInviteUsersForm";
import { adminSettingsCategoryUrl } from "RouteBuilder";
import { SettingCategories } from "@appsmith/pages/AdminSettings/config/types";

export const CellContainer = styled.div`
  display: flex;
  align-items: baseline;

  .user-icons {
    margin-right 8px;
    cursor: initial;

    span {
      color: var(--appsmith-color-black-0);
    }
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

export type User = {
  isCurrentUser: boolean;
  allRoles: Array<string>;
  userId: string;
  username: string;
  name: string;
  roleName?: string;
  isDeleting: boolean;
  isChangingRole: boolean;
};

export const allUsers: User[] = [
  {
    isChangingRole: false,
    isCurrentUser: true,
    isDeleting: false,
    name: "Ankita Kinger",
    // roleName: "Administrator + 2 more",
    allRoles: ["Administrator", "Test_Admin", "HR_Admin"],
    username: "techak@appsmith.com",
    userId: "123",
  },
  {
    isChangingRole: false,
    isCurrentUser: false,
    isDeleting: false,
    name: "Sangy Sivan",
    // roleName: "App Viewer + 1 more",
    allRoles: ["App Viewer", "HR_Admin"],
    username: "sangy@appsmith.com",
    userId: "456",
  },
  {
    isChangingRole: false,
    isCurrentUser: false,
    isDeleting: false,
    name: "SS Sivan",
    // roleName: "App Viewer + 1 more",
    allRoles: ["App Viewer", "HR_Admin"],
    username: "sangy123@appsmith.com",
    userId: "789",
  },
];

export function UserListing() {
  // const dispatch = useDispatch();
  // useEffect(() => {
  //   dispatch(fetchUsersForOrg("626a2ce37a900c13a72aa24b"));
  //   dispatch(fetchRolesForOrg("626a2ce37a900c13a72aa24b"));
  // }, []);
  // const allUsers = useSelector(getAllUsers);
  const currentUser = useSelector(getCurrentUser);
  const history = useHistory();
  const params = useParams() as any;
  const selectedUserId = params?.selected;
  const selectedUser = allUsers.find((user) => user.userId === selectedUserId);

  const userTableData = allUsers.map((user) => ({
    ...user,
    isCurrentUser: user.username === currentUser?.username,
  }));

  const [data, setData] = useState<User[]>([]);
  const [searchValue, setSearchValue] = useState("");
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    setData(allUsers);
  }, []);

  const onDeleteHanlder = (userId: string) => {
    const updatedData = data.filter((user) => {
      return user.userId !== userId;
    });
    setData(updatedData);
  };

  const columns = [
    {
      Header: `User (${data.length})`,
      accessor: "username",
      Cell: function UserCell(cellProps: any) {
        return (
          <Link
            data-testid="acl-user-listing-link"
            to={adminSettingsCategoryUrl({
              category: SettingCategories.USER_LISTING,
              selected: cellProps.cell.row.original.userId,
            })}
          >
            <CellContainer data-testid="user-listing-userCell">
              <ProfileImage
                className="user-icons"
                size={20}
                source={`/api/v1/users/photo/${cellProps.cell.row.values.username}`}
                userName={cellProps.cell.row.values.username}
              />
              <HighlightText
                highlight={searchValue}
                text={cellProps.cell.row.values.username}
              />
            </CellContainer>
          </Link>
        );
      },
    },
    {
      Header: "User Groups",
      accessor: "allRoles",
      Cell: function UserGroupCell(cellProps: any) {
        const [showAllGroups, setShowAllGroups] = useState(false);

        return (
          <CellContainer data-testid="user-listing-userGroupCell">
            {showAllGroups ? (
              <AllGroups>
                {cellProps.cell.row.values.allRoles.map((group: any) => (
                  <div key={group}>{group}</div>
                ))}
                <ShowLess
                  data-testid="t--show-less"
                  onClick={() => setShowAllGroups(false)}
                >
                  show less
                </ShowLess>
              </AllGroups>
            ) : (
              <GroupWrapper>
                {cellProps.cell.row.values.allRoles[0]}
                {cellProps.cell.row.values.allRoles[0].length < 30 ? (
                  <>
                    , {cellProps.cell.row.values.allRoles[1]}
                    {cellProps.cell.row.values.allRoles.length > 2 && (
                      <MoreGroups
                        data-testid="t--show-more"
                        onClick={() => setShowAllGroups(true)}
                      >
                        show {cellProps.cell.row.values.allRoles.length - 2}{" "}
                        more
                      </MoreGroups>
                    )}
                  </>
                ) : (
                  cellProps.cell.row.values.allRoles.length > 1 && (
                    <MoreGroups
                      data-testid="t--show-more"
                      onClick={() => setShowAllGroups(true)}
                    >
                      show {cellProps.cell.row.values.allRoles.length - 1} more
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
      onSelect: (e, userId: string) => {
        userId && history.push(`/settings/users/${userId}`);
      },
      text: "Edit User Groups",
    },
    {
      label: "delete",
      className: "delete-menu-item",
      icon: "delete-blank",
      onSelect: (e, key: string) => {
        onDeleteHanlder(key);
      },
      text: "Delete User",
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

  const onButtonClick = () => {
    setShowModal(true);
  };

  const onSearch = debounce((search: string) => {
    if (search && search.trim().length > 0) {
      setSearchValue(search);
      const results =
        userTableData &&
        userTableData.filter((user) =>
          user.username?.toLocaleUpperCase().includes(search),
        );
      setData(results);
    } else {
      setSearchValue("");
      setData(userTableData);
    }
  }, 300);

  return (
    <AclWrapper data-testid="user-listing-wrapper">
      {selectedUser ? (
        <UserEdit
          data-testid="acl-user-edit"
          onDelete={onDeleteHanlder}
          searchPlaceholder="Search users"
          selectedUser={selectedUser}
        />
      ) : (
        <>
          <PageHeader
            buttonText="Add Users"
            data-testid="acl-user-listing-pageheader"
            onButtonClick={onButtonClick}
            onSearch={onSearch}
            pageMenuItems={pageMenuItems}
            searchPlaceholder="Search Users"
          />
          <Listing
            columns={columns}
            data={data}
            data-testid="acl-user-listing"
            keyAccessor="userId"
            listMenuItems={listMenuItems}
          />
          <FormDialogComponent
            Form={OrgInviteUsersForm}
            canOutsideClickClose
            customProps={{
              isAclFlow: true,
              disableEmailSetup: true,
              disableManageUsers: true,
              disableUserList: true,
              isMultiSelectDropdown: true,
            }}
            data-testid="acl-user-listing-form"
            isOpen={showModal}
            onClose={() => setShowModal(false)}
            title={`Invite Users`}
            trigger
          />
        </>
      )}
      <BottomSpace />
    </AclWrapper>
  );
}
