import React, { useEffect, useState } from "react";
import { useParams, useHistory } from "react-router";
import { Link } from "react-router-dom";
import styled from "styled-components";
import debounce from "lodash/debounce";
import { Listing } from "./Listing";
import { HighlightText, MenuItemProps } from "design-system";
import { PageHeader } from "./PageHeader";
import { BottomSpace } from "pages/Settings/components";
import {
  AclWrapper,
  AppsmithIcon,
  EmptyDataState,
  EmptySearchResult,
} from "./components";
import { adminSettingsCategoryUrl } from "RouteBuilder";
import { SettingCategories } from "@appsmith/pages/AdminSettings/config/types";
import { RoleAddEdit } from "./RoleAddEdit";
import { useDispatch, useSelector } from "react-redux";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import {
  createRole,
  deleteRole,
  getRoleById,
} from "@appsmith/actions/aclActions";
import {
  ADD_ROLE,
  createMessage,
  ACL_DELETE,
  ACL_EDIT,
  SEARCH_ROLES_PLACEHOLDER,
} from "@appsmith/constants/messages";
import {
  getAclIsLoading,
  getRoles,
  getSelectedRole,
} from "@appsmith/selectors/aclSelectors";
import { ListingType, RoleProps } from "./types";
import {
  isPermitted,
  PERMISSION_TYPE,
} from "@appsmith/utils/permissionHelpers";
import { getTenantPermissions } from "@appsmith/selectors/tenantSelectors";
import { getNextEntityName } from "utils/AppsmithUtils";

const CellContainer = styled.div`
  display: flex;
  align-items: center;
  cursor: pointer;
`;

export function RolesListing() {
  const params = useParams() as any;
  const history = useHistory();
  const dispatch = useDispatch();

  const roles = useSelector(getRoles);
  const selectedRoleProps = useSelector(getSelectedRole);
  const isLoading = useSelector(getAclIsLoading);

  const [data, setData] = useState<RoleProps[]>([]);
  const [searchValue, setSearchValue] = useState("");
  const [selectedRole, setSelectedRole] = useState<RoleProps | null>(null);
  const [isNewRole, setIsNewRole] = useState(false);

  const selectedRoleId = params?.selected;

  const tenantPermissions = useSelector(getTenantPermissions);

  const canCreateRole = isPermitted(
    tenantPermissions,
    PERMISSION_TYPE.CREATE_PERMISSIONGROUPS,
  );

  useEffect(() => {
    if (searchValue) {
      onSearch(searchValue);
    } else {
      setData(roles);
    }
  }, [roles]);

  useEffect(() => {
    setSelectedRole(selectedRoleProps);
  }, [selectedRoleProps]);

  useEffect(() => {
    if (selectedRoleId && selectedRoleProps?.id !== selectedRoleId) {
      setSelectedRole(null);
      dispatch(getRoleById({ id: selectedRoleId }));
    } else if (!selectedRoleId) {
      dispatch({ type: ReduxActionTypes.FETCH_ACL_ROLES });
      setIsNewRole(false);
    }
  }, [selectedRoleId]);

  useEffect(() => {
    return () => {
      dispatch({ type: ReduxActionTypes.RESET_ROLES_DATA });
    };
  }, []);

  const columns = [
    {
      Header: `Roles (${data.length})`,
      accessor: "name",
      Cell: function RoleCell(cellProps: any) {
        return (
          <Link
            data-testid="t--roles-cell"
            to={adminSettingsCategoryUrl({
              category: SettingCategories.ROLES_LISTING,
              selected: cellProps.cell.row.original.id,
            })}
          >
            <CellContainer>
              <HighlightText
                highlight={searchValue}
                text={cellProps.cell.row.original.name}
              />
              {cellProps.cell.row.original.autoCreated && (
                <AppsmithIcon data-testid="t--appsmith-badge">A</AppsmithIcon>
              )}
            </CellContainer>
          </Link>
        );
      },
    },
  ];

  const listMenuItems: MenuItemProps[] = [
    {
      className: "edit-menu-item",
      icon: "edit-underline",
      onSelect: (e: React.MouseEvent, key: string) => {
        history.push(`/settings/roles/${key}`);
      },
      text: createMessage(ACL_EDIT),
      label: "edit",
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
          "https://docs.appsmith.com/advanced-concepts/access-control/granular-access-control/roles",
          "_blank",
        );
      },
      text: "Documentation",
    },
  ];

  const onAddButtonClick = () => {
    const newRoleName = getNextEntityName(
      "Untitled Role ",
      roles.map((el: any) => el.name),
    );
    dispatch(
      createRole({
        name: newRoleName,
      }),
    );
    setIsNewRole(true);
  };

  const onSearch = debounce((search: string) => {
    if (search && search.trim().length > 0) {
      setSearchValue(search);
      const results =
        roles &&
        roles.filter((role) => role.name?.toLocaleUpperCase().includes(search));
      setData(results);
    } else {
      setSearchValue("");
      setData(roles);
    }
  }, 300);

  const onDeleteHandler = (id: string) => {
    dispatch(deleteRole({ id }));
    /* for jest tests */
    const updatedData = data.filter((role) => {
      return role.id !== id;
    });
    setData(updatedData);
    /* for jest tests */
  };

  return (
    <AclWrapper data-testid="t--roles-listing-wrapper">
      {selectedRoleId && selectedRole ? (
        <RoleAddEdit
          isLoading={isLoading}
          isNew={isNewRole}
          onDelete={onDeleteHandler}
          selected={selectedRole}
        />
      ) : (
        <>
          <PageHeader
            buttonText={createMessage(ADD_ROLE)}
            disableButton={!canCreateRole}
            onButtonClick={onAddButtonClick}
            onSearch={onSearch}
            pageMenuItems={pageMenuItems}
            searchPlaceholder={createMessage(SEARCH_ROLES_PLACEHOLDER)}
            searchValue={searchValue}
          />
          <Listing
            columns={columns}
            data={data}
            emptyState={
              searchValue ? (
                <EmptySearchResult />
              ) : (
                <EmptyDataState page="roles" />
              )
            }
            isLoading={isLoading}
            keyAccessor="id"
            listMenuItems={listMenuItems}
            listingType={ListingType.ROLES}
          />
        </>
      )}
      <BottomSpace />
    </AclWrapper>
  );
}
