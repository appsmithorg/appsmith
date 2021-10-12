import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  getAllUsers,
  getAllRoles,
  getCurrentOrg,
  getOrgLoadingStates,
} from "selectors/organizationSelectors";
import PageSectionHeader from "pages/common/PageSectionHeader";
import OrgInviteUsersForm from "pages/organization/OrgInviteUsersForm";
import { RouteComponentProps } from "react-router";
import FormDialogComponent from "components/editorComponents/form/FormDialogComponent";
import { getCurrentUser } from "selectors/usersSelectors";
import Table from "components/ads/Table";
import Icon, { IconSize } from "components/ads/Icon";
import {
  fetchUsersForOrg,
  fetchRolesForOrg,
  fetchOrg,
  changeOrgUserRole,
  deleteOrgUser,
} from "actions/orgActions";
import Button, { Size } from "components/ads/Button";
import TableDropdown from "components/ads/TableDropdown";
import Dropdown from "components/ads/Dropdown";
import Text, { TextType } from "components/ads/Text";
import { SettingsHeading } from "./General";
import styled from "styled-components";
import { Classes } from "@blueprintjs/core";
import { Classes as AppClass } from "components/ads/common";
import { Variant } from "components/ads/common";
import DeleteConfirmationModal from "./DeleteConfirmationModal";
import { useMediaQuery } from "react-responsive";
import { Card } from "@blueprintjs/core";
import ProfileImage from "pages/common/ProfileImage";
import { USER_PHOTO_URL } from "constants/userConstants";

export type PageProps = RouteComponentProps<{
  orgId: string;
}>;

const Loader = styled.div`
  height: 120px;
  width: 100%;
`;

const MembersWrapper = styled.div<{
  isMobile?: boolean;
}>`
  ${(props) => (props.isMobile ? "width: 100%; margin: auto" : null)}
`;

const ButtonWrapper = styled.div`
  margin-top: 10px;
  a {
    padding: 0 8px;
  }
  span:last-child {
    font-size: 14px;
  }
  svg {
    path {
      stroke: #ffffff;
      fill: #ffffff;
    }
  }
  button {
    padding: 6px 8px;
  }
`;

const UserCardContainer = styled.div`
  display: flex;
  flex-grow: 1;
  flex-direction: column;
  justify-content: center;
  width: 100%;
  margin: auto;
`;

const UserCard = styled(Card)`
  display: flex;
  flex-direction: column;
  background-color: #ebebeb;
  padding: ${(props) => props.theme.spaces[15]}px 64px;
  width: 345px;
  height: 201px;
  margin: auto;
  margin-bottom: 15px;
  align-items: center;
  justify-content: center;

  .avatar {
    min-height: 71px;
  }

  .${AppClass.TEXT} {
    color: #090707;
    &.email {
      color: #858282;
    }
  }

  .approve-btn {
    background: #f86a2b;
  }
`;

const TableWrapper = styled(Table)`
  tbody {
    tr:hover {
      .t--deleteUser {
        path {
          fill: #ff6786;
        }
      }
    }
  }
`;

export default function MemberSettings(props: PageProps) {
  const {
    match: {
      params: { orgId },
    },
    // deleteOrgUser,
    // changeOrgUserRole,
  } = props;

  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(fetchUsersForOrg(orgId));
    dispatch(fetchRolesForOrg(orgId));
    dispatch(fetchOrg(orgId));
  }, [orgId]);

  const [
    showMemberDeletionConfirmation,
    setShowMemberDeletionConfirmation,
  ] = useState(false);
  const [isDeletingUser, setIsDeletingUser] = useState(false);
  const onOpenConfirmationModal = () => setShowMemberDeletionConfirmation(true);
  const onCloseConfirmationModal = () =>
    setShowMemberDeletionConfirmation(false);

  const [userToBeDeleted, setUserToBeDeleted] = useState<{
    name: string;
    username: string;
    orgId: string;
  } | null>(null);

  const onConfirmMemberDeletion = (
    name: string,
    username: string,
    orgId: string,
  ) => {
    setUserToBeDeleted({ name, username, orgId });
    onOpenConfirmationModal();
  };

  const onDeleteMember = () => {
    if (!userToBeDeleted) return null;
    dispatch(deleteOrgUser(userToBeDeleted.orgId, userToBeDeleted.username));
  };

  const {
    deletingUserInfo,
    isFetchingAllRoles,
    isFetchingAllUsers,
    roleChangingUserInfo,
  } = useSelector(getOrgLoadingStates);
  const allRoles = useSelector(getAllRoles);
  const allUsers = useSelector(getAllUsers);
  const currentUser = useSelector(getCurrentUser);
  const currentOrg = useSelector(getCurrentOrg).filter(
    (el) => el.id === orgId,
  )[0];

  useEffect(() => {
    if (!!userToBeDeleted && showMemberDeletionConfirmation) {
      const userBeingDeleted = allUsers.find(
        (user) => user.username === userToBeDeleted.username,
      );
      if (!userBeingDeleted) {
        setUserToBeDeleted(null);
        onCloseConfirmationModal();
        setIsDeletingUser(false);
      } else {
        setIsDeletingUser(userBeingDeleted.isDeleting);
      }
    }
  }, [allUsers]);

  const userTableData = allUsers.map((user) => ({
    ...user,
    isCurrentUser: user.username === currentUser?.username,
  }));

  const columns = [
    {
      Header: "Name",
      accessor: "name",
    },
    {
      Header: "Email",
      accessor: "username",
    },
    {
      Header: "Role",
      accessor: "roleName",
      Cell: function DropdownCell(cellProps: any) {
        const allRoles = useSelector(getAllRoles);
        const roles = allRoles
          ? Object.keys(allRoles).map((role) => {
              return {
                name: role,
                desc: allRoles[role],
              };
            })
          : [];
        const index = roles.findIndex(
          (role: { name: string; desc: string }) =>
            role.name === cellProps.cell.value,
        );
        if (
          cellProps.cell.row.values.username ===
          useSelector(getCurrentUser)?.username
        ) {
          return cellProps.cell.value;
        }
        return (
          <TableDropdown
            isLoading={
              roleChangingUserInfo &&
              roleChangingUserInfo.username ===
                cellProps.cell.row.values.username
            }
            onSelect={(option) => {
              dispatch(
                changeOrgUserRole(
                  orgId,
                  option.name,
                  cellProps.cell.row.values.username,
                ),
              );
            }}
            options={roles}
            selectedIndex={index}
            selectedTextWidth="90px"
          />
        );
      },
    },
    {
      Header: "Status",
      accessor: "status",
    },
    {
      Header: "Actions",
      accessor: "delete",
      disableSortBy: true,
      Cell: function DeleteCell(cellProps: any) {
        return (
          <Icon
            className="t--deleteUser"
            cypressSelector="t--deleteUser"
            fillColor="#FF6786"
            hoverFillColor="#FF6786"
            isLoading={
              deletingUserInfo &&
              deletingUserInfo.username === cellProps.cell.row.values.username
            }
            name="trash-outline"
            onClick={() => {
              onConfirmMemberDeletion(
                cellProps.cell.row.values.username,
                cellProps.cell.row.values.username,
                orgId,
              );
            }}
            size={IconSize.LARGE}
          />
        );
      },
    },
  ];
  const currentOrgName = currentOrg?.name ?? "";
  const isMobile: boolean = useMediaQuery({ maxWidth: 767 });
  const roles = allRoles
    ? Object.keys(allRoles).map((role) => {
        return {
          id: role,
          value: role,
          label: allRoles[role],
        };
      })
    : [];

  const selectRole = (option: any, username: any) => {
    dispatch(changeOrgUserRole(orgId, option, username));
  };
  return (
    <MembersWrapper isMobile={isMobile}>
      <PageSectionHeader>
        <SettingsHeading type={TextType.H1}>Manage Users</SettingsHeading>
        <FormDialogComponent
          Form={OrgInviteUsersForm}
          canOutsideClickClose
          orgId={orgId}
          title={`Invite Users to ${currentOrgName}`}
          trigger={
            <ButtonWrapper>
              <Button
                cypressSelector="t--invite-users"
                icon="plus"
                size={Size.medium}
                tag="button"
                text="Invite Users"
                variant={Variant.info}
              />
            </ButtonWrapper>
          }
        />
      </PageSectionHeader>
      {isFetchingAllUsers && isFetchingAllRoles ? (
        <Loader className={Classes.SKELETON} />
      ) : (
        <>
          {!isMobile && <TableWrapper columns={columns} data={userTableData} />}
          {isMobile && (
            <UserCardContainer>
              {allUsers.map((user, index) => {
                const role =
                  roles.find((role) => role.value === user.roleName) ||
                  roles[0];
                return (
                  <UserCard key={index}>
                    <ProfileImage
                      className="avatar"
                      side={71}
                      source={`/api/${USER_PHOTO_URL}/${user.username}`}
                      userName={"Test User"}
                    />
                    <Text type={TextType.P1}>{user.name || user.username}</Text>
                    <Text className="email" type={TextType.P1}>
                      {user.username}
                    </Text>
                    <Dropdown
                      height="31px"
                      onSelect={(value) => {
                        selectRole(value, user.username);
                      }}
                      options={roles}
                      selected={role}
                      width="140px"
                    />
                    <Button
                      className="approve-btn"
                      size={Size.xxs}
                      text="Approve"
                    />
                  </UserCard>
                );
              })}
            </UserCardContainer>
          )}
          <DeleteConfirmationModal
            isDeletingUser={isDeletingUser}
            isOpen={showMemberDeletionConfirmation}
            name={userToBeDeleted && userToBeDeleted.name}
            onClose={onCloseConfirmationModal}
            onConfirm={onDeleteMember}
            username={userToBeDeleted && userToBeDeleted.username}
          />
        </>
      )}
    </MembersWrapper>
  );
}
