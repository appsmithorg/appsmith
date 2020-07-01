import React, { useEffect } from "react";
import { connect } from "react-redux";
import { Icon } from "@blueprintjs/core";
import { TableWrapper } from "components/designSystems/appsmith/TableStyledWrappers";
import { AppState } from "reducers";
import {
  getAllUsers,
  getAllRoles,
  getOrgs,
} from "selectors/organizationSelectors";
import PageSectionDivider from "pages/common/PageSectionDivider";
import PageSectionHeader from "pages/common/PageSectionHeader";
import { ReduxActionTypes } from "constants/ReduxActionConstants";
import InviteUsersFormv2 from "pages/organization/InviteUsersFromv2";
import Button from "components/editorComponents/Button";
import { OrgUser, Organization } from "constants/orgConstants";
import { Menu, MenuItem, Popover, Position } from "@blueprintjs/core";
import styled from "styled-components";
import { FormIcons } from "icons/FormIcons";
import { RouteComponentProps } from "react-router";
import Spinner from "components/editorComponents/Spinner";
import FormDialogComponent from "components/editorComponents/form/FormDialogComponent";
import { getCurrentUser } from "selectors/usersSelectors";
import { User } from "constants/userConstants";
import { useTable, useFlexLayout } from "react-table";
type OrgProps = {
  allOrgs: Organization[];
  changeOrgName: (value: string) => void;
  getAllApplication: () => void;
  fetchUser: (orgId: string) => void;
  fetchAllRoles: (orgId: string) => void;
  deleteOrgUser: (orgId: string, username: string) => void;
  changeOrgUserRole: (orgId: string, role: string, username: string) => void;
  allUsers: OrgUser[];
  allRole: object;
  currentUser: User | undefined;
  isFetchAllUsers: boolean;
  isFetchAllRoles: boolean;
};

export type PageProps = OrgProps &
  RouteComponentProps<{
    orgId: string;
  }>;

export type MenuItemProps = {
  rolename: string;
};

type DropdownProps = {
  activeItem: string;
  userRoles: object;
  username: string;
};

const StyledDropDown = styled.div`
  cursor: pointer;
`;

const StyledTableWrapped = styled(TableWrapper)`
  width: 100%;
  height: auto;
  font-size: 14px;
  .table {
    .tbody {
      overflow: auto;
      height: auto;
      max-height: calc(
        100vh - (100vh / 3) - ${props => props.theme.headerHeight}
      );
    }
  }
`;

const StyledMenu = styled(Menu)`
  &&&&.bp3-menu {
    max-width: 250px;
    cursor: pointer;
  }
`;

export const OrgSettings = (props: PageProps) => {
  const {
    match: {
      params: { orgId },
    },
    deleteOrgUser,
    changeOrgUserRole,
    allOrgs,
    fetchUser,
    fetchAllRoles,
    getAllApplication,
  } = props;

  const userTableData = props.allUsers.map(user => ({
    ...user,
    roles: props.allRole,
    isCurrentUser: user.username === props.currentUser?.username,
  }));
  const data = React.useMemo(() => userTableData, [
    props.allUsers,
    props.allRole,
  ]);

  const RoleNameCell = (cellProps: any) => {
    const {
      roleName,
      roles,
      username,
      isCurrentUser,
      isChangingRole,
    } = cellProps.row.original;

    if (isCurrentUser) {
      return <div>{roleName}</div>;
    }

    return (
      <Popover
        content={
          <Dropdown
            activeItem={roleName}
            userRoles={roles}
            username={username}
          />
        }
        position={Position.BOTTOM_LEFT}
      >
        <StyledDropDown>
          {roleName}
          <Icon icon="chevron-down" />
          {isChangingRole ? <Spinner size={20} /> : undefined}
        </StyledDropDown>
      </Popover>
    );
  };

  const columns = React.useMemo(() => {
    return [
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
        Cell: RoleNameCell,
      },
      {
        Header: "Delete",
        accessor: "delete",
        Cell: (cellProps: any) => {
          const {
            username,
            isCurrentUser,
            isDeleting,
          } = cellProps.row.original;

          return (
            !isCurrentUser &&
            (isDeleting ? (
              <Spinner size={20} />
            ) : (
              <FormIcons.DELETE_ICON
                height={20}
                width={20}
                color={"grey"}
                background={"grey"}
                onClick={() => deleteOrgUser(orgId, username)}
                style={{ alignSelf: "center", cursor: "pointer" }}
              />
            ))
          );
        },
      },
    ];
  }, [props.allUsers, props.allRole]);

  const currentOrg = allOrgs.find(org => org.organization.id === orgId);
  const currentOrgName = currentOrg?.organization.name ?? "";
  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    rows,
    prepareRow,
  } = useTable(
    {
      columns,
      data,
      manualPagination: true,
    },
    useFlexLayout,
  );

  useEffect(() => {
    fetchUser(orgId);
    fetchAllRoles(orgId);
    getAllApplication();
  }, [orgId, fetchUser, fetchAllRoles, getAllApplication]);

  const Dropdown = (props: DropdownProps) => {
    return (
      <StyledMenu>
        {Object.entries(props.userRoles).map((role, index) => {
          const MenuContent = (
            <div>
              <span>
                <b>{role[0]}</b>
              </span>
              <div>{role[1]}</div>
            </div>
          );

          return (
            <MenuItem
              multiline
              key={index}
              onClick={() => changeOrgUserRole(orgId, role[0], props.username)}
              active={props.activeItem === role[0]}
              text={MenuContent}
            />
          );
        })}
      </StyledMenu>
    );
  };

  return (
    <React.Fragment>
      <PageSectionHeader>
        <h2>{currentOrgName}</h2>
      </PageSectionHeader>
      <PageSectionDivider />
      <PageSectionHeader>
        <h2>Users</h2>
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
          Form={InviteUsersFormv2}
          orgId={orgId}
          title={`Invite Users to ${currentOrgName}`}
          setMaxWidth
        />
      </PageSectionHeader>
      {props.isFetchAllUsers && props.isFetchAllRoles ? (
        <Spinner size={30} />
      ) : (
        <StyledTableWrapped width={200} height={200}>
          <div className="tableWrap">
            <div {...getTableProps()} className="table">
              {headerGroups.map((headerGroup: any, index: number) => (
                <div
                  key={index}
                  {...headerGroup.getHeaderGroupProps()}
                  className="tr"
                >
                  {headerGroup.headers.map(
                    (column: any, columnIndex: number) => (
                      <div
                        key={columnIndex}
                        {...column.getHeaderProps()}
                        className="th header-reorder"
                      >
                        <div
                          className={
                            !column.isHidden
                              ? "draggable-header"
                              : "hidden-header"
                          }
                        >
                          {column.render("Header")}
                        </div>
                      </div>
                    ),
                  )}
                </div>
              ))}
              <div {...getTableBodyProps()} className="tbody">
                {rows.map((row: any, index: number) => {
                  prepareRow(row);
                  return (
                    <div key={index} {...row.getRowProps()} className={"tr"}>
                      {row.cells.map((cell: any, cellIndex: number) => {
                        return (
                          <div
                            key={cellIndex}
                            {...cell.getCellProps()}
                            className="td"
                            data-rowindex={index}
                            data-colindex={cellIndex}
                          >
                            {cell.render("Cell")}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </StyledTableWrapped>
      )}
    </React.Fragment>
  );
};

const mapStateToProps = (state: AppState) => ({
  allUsers: getAllUsers(state),
  allRole: getAllRoles(state),
  isFetchAllUsers: state.ui.orgs.loadingStates.isFetchAllUsers,
  isFetchAllRoles: state.ui.orgs.loadingStates.isFetchAllRoles,
  allOrgs: getOrgs(state),
  currentUser: getCurrentUser(state),
});

const mapDispatchToProps = (dispatch: any) => ({
  getAllApplication: () =>
    dispatch({ type: ReduxActionTypes.GET_ALL_APPLICATION_INIT }),
  changeOrgName: (name: string) =>
    dispatch({
      type: ReduxActionTypes.UPDATE_ORG_NAME_INIT,
      payload: {
        name,
      },
    }),
  changeOrgUserRole: (orgId: string, role: string, username: string) =>
    dispatch({
      type: ReduxActionTypes.CHANGE_ORG_USER_ROLE_INIT,
      payload: {
        orgId,
        role,
        username,
      },
    }),
  deleteOrgUser: (orgId: string, username: string) =>
    dispatch({
      type: ReduxActionTypes.DELETE_ORG_USER_INIT,
      payload: {
        orgId,
        username,
      },
    }),
  fetchUser: (orgId: string) =>
    dispatch({
      type: ReduxActionTypes.FETCH_ALL_USERS_INIT,
      payload: {
        orgId,
      },
    }),
  fetchAllRoles: (orgId: string) =>
    dispatch({
      type: ReduxActionTypes.FETCH_ALL_ROLES_INIT,
      payload: {
        orgId,
      },
    }),
});

export default connect(mapStateToProps, mapDispatchToProps)(OrgSettings);
