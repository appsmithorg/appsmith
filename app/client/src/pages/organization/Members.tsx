import React, { useEffect } from "react";
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
// import Spinner from "components/editorComponents/Spinner";
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
import { TextType } from "components/ads/Text";
import { SettingsHeading } from "./General";
import styled from "styled-components";
import { Classes } from "@blueprintjs/core";
import { Variant } from "components/ads/common";

export type PageProps = RouteComponentProps<{
  orgId: string;
}>;

const Loader = styled.div`
  height: 120px;
  width: 100%;
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

  const {
    deletingUserInfo,
    isFetchingAllRoles,
    isFetchingAllUsers,
    roleChangingUserInfo,
  } = useSelector(getOrgLoadingStates);
  const allUsers = useSelector(getAllUsers);
  const currentUser = useSelector(getCurrentUser);
  const currentOrg = useSelector(getCurrentOrg).filter(
    (el) => el.id === orgId,
  )[0];

  const userTableData = allUsers.map((user) => ({
    ...user,
    isCurrentUser: user.username === currentUser?.username,
  }));

  const columns = [
    {
      Header: "Email",
      accessor: "username",
    },
    {
      Header: "Name",
      accessor: "name",
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
          />
        );
      },
    },
    {
      Header: "Delete",
      accessor: "delete",
      disableSortBy: true,
      Cell: function DeleteCell(cellProps: any) {
        if (
          cellProps.cell.row.values.username ===
          useSelector(getCurrentUser)?.username
        ) {
          return null;
        }
        return (
          <Icon
            cypressSelector="t--deleteUser"
            isLoading={
              deletingUserInfo &&
              deletingUserInfo.username === cellProps.cell.row.values.username
            }
            name="delete"
            onClick={() => {
              dispatch(
                deleteOrgUser(orgId, cellProps.cell.row.values.username),
              );
            }}
            size={IconSize.LARGE}
          />
        );
      },
    },
  ];

  const currentOrgName = currentOrg?.name ?? "";

  return (
    <>
      <PageSectionHeader>
        <SettingsHeading type={TextType.H2}>Manage Users</SettingsHeading>
        <FormDialogComponent
          Form={OrgInviteUsersForm}
          canOutsideClickClose
          orgId={orgId}
          title={`Invite Users to ${currentOrgName}`}
          trigger={
            <Button
              cypressSelector="t--invite-users"
              size={Size.medium}
              text="Invite Users"
              variant={Variant.info}
            />
          }
        />
      </PageSectionHeader>
      {isFetchingAllUsers && isFetchingAllRoles ? (
        <Loader className={Classes.SKELETON} />
      ) : (
        <Table columns={columns} data={userTableData} />
      )}
    </>
  );
}
