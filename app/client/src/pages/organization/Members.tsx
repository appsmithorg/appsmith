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
import Button, { Size, Variant } from "components/ads/Button";
import TableDropdown from "components/ads/TableDropdown";
import { TextType } from "components/ads/Text";
import { SettingsHeading } from "./General";
import styled from "styled-components";
import { Classes } from "@blueprintjs/core";

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
    isFetchingAllUsers,
    isFetchingAllRoles,
    deletingUserInfo,
    roleChangingUserInfo,
  } = useSelector(getOrgLoadingStates);
  const allUsers = useSelector(getAllUsers);
  const currentUser = useSelector(getCurrentUser);
  const currentOrg = useSelector(getCurrentOrg);

  const userTableData = allUsers.map(user => ({
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
          ? Object.keys(allRoles).map(role => {
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
            selectedIndex={index}
            options={roles}
            isLoading={
              roleChangingUserInfo &&
              roleChangingUserInfo.username ===
                cellProps.cell.row.values.username
            }
            onSelect={option => {
              dispatch(
                changeOrgUserRole(
                  orgId,
                  option.name,
                  cellProps.cell.row.values.username,
                ),
              );
            }}
          ></TableDropdown>
        );
      },
    },
    {
      Header: "Delete",
      accessor: "delete",
      Cell: function DeleteCell(cellProps: any) {
        if (
          cellProps.cell.row.values.username ===
          useSelector(getCurrentUser)?.username
        ) {
          return null;
        }
        return (
          <Icon
            name="delete"
            size={IconSize.LARGE}
            cypressSelector="t--deleteUser"
            isLoading={
              deletingUserInfo &&
              deletingUserInfo.username === cellProps.cell.row.values.username
            }
            onClick={() => {
              dispatch(
                deleteOrgUser(orgId, cellProps.cell.row.values.username),
              );
            }}
          />
        );
      },
    },
  ];

  const currentOrgName = currentOrg?.name ?? "";

  return (
    <React.Fragment>
      <PageSectionHeader>
        <SettingsHeading type={TextType.H2}>Manage Users</SettingsHeading>
        <FormDialogComponent
          trigger={
            <Button
              cypressSelector="t--invite-users"
              variant={Variant.info}
              text="Invite Users"
              size={Size.medium}
            ></Button>
          }
          canOutsideClickClose={true}
          Form={OrgInviteUsersForm}
          orgId={orgId}
          title={`Invite Users to ${currentOrgName}`}
        />
      </PageSectionHeader>
      {isFetchingAllUsers && isFetchingAllRoles ? (
        <Loader className={Classes.SKELETON} />
      ) : (
        <Table data={userTableData} columns={columns}></Table>
      )}
    </React.Fragment>
  );
}
