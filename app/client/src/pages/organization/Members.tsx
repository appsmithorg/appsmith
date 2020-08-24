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
import Button from "components/editorComponents/Button";
import { RouteComponentProps } from "react-router";
import Spinner from "components/editorComponents/Spinner";
import FormDialogComponent from "components/editorComponents/form/FormDialogComponent";
import { getCurrentUser } from "selectors/usersSelectors";
import { User } from "constants/userConstants";
// import { useTable, useFlexLayout } from "react-table";
import Table from "components/ads/Table";
import Icon from "components/ads/Icon";
import {
  fetchUsersForOrg,
  fetchRolesForOrg,
  fetchOrg,
  changeOrgUserRole,
  deleteOrgUser,
} from "actions/orgActions";
import { Size } from "components/ads/Button";
import TableDropdown from "components/ads/TableDropdown";

export type PageProps = RouteComponentProps<{
  orgId: string;
}>;

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

  const { isFetchingAllUsers, isFetchingAllRoles } = useSelector(
    getOrgLoadingStates,
  );
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
        return (
          <TableDropdown
            selectedIndex={index}
            options={roles}
            onSelect={option => {
              console.log(option);
            }}
          ></TableDropdown>
        );
      },
    },
    {
      Header: "Delete",
      accessor: "delete",
      Cell: function DeleteCell(cellProps: any) {
        return (
          <Icon
            name={"delete"}
            size={Size.large}
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
        <h2>Manage Users</h2>
        <FormDialogComponent
          trigger={
            <Button
              intent="primary"
              text="Invite Users"
              icon="plus"
              iconAlignment="left"
              filled
            />
          }
          canOutsideClickClose={true}
          Form={OrgInviteUsersForm}
          orgId={orgId}
          title={`Invite Users to ${currentOrgName}`}
        />
      </PageSectionHeader>
      {isFetchingAllUsers && isFetchingAllRoles ? (
        <Spinner size={30} />
      ) : (
        <Table data={userTableData} columns={columns}></Table>
      )}
    </React.Fragment>
  );
}
