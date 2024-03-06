import React, { useEffect, useMemo, useState } from "react";
import { useParams, useHistory } from "react-router";
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
import {
  AclWrapper,
  DefaultRolesToggle,
  EmptyDataState,
  EmptySearchResult,
  MoreInfoPill,
} from "./components";
import { adminSettingsCategoryUrl } from "@appsmith/RouteBuilder";
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
  createMessage,
  ADD_ROLE,
  ACL_DELETE,
  ACL_EDIT,
  SEARCH_ROLES_PLACEHOLDER,
  DEFAULT_ROLES_PILL,
} from "@appsmith/constants/messages";
import {
  getAclIsLoading,
  getRoles,
  getSelectedRole,
} from "@appsmith/selectors/aclSelectors";
import type { MenuItemProps, RoleProps } from "./types";
import { ListingType } from "./types";
import {
  isPermitted,
  PERMISSION_TYPE,
} from "@appsmith/utils/permissionHelpers";
import { getTenantPermissions } from "@appsmith/selectors/tenantSelectors";
import { getNextEntityName } from "utils/AppsmithUtils";
import { Icon, Spinner } from "design-system";

const CellContainer = styled.div`
  display: flex;
  align-items: center;
  cursor: pointer;
  color: var(--ads-v2-color-fg);
  gap: var(--ads-v2-spaces-4);
`;

const CrossedEditIcon = styled(Icon)`
  position: relative;
  &:before {
    content: "";
    position: absolute;
    width: 100%;
    height: 100%;
    left: 4px;
    top: -4px;
    border-bottom: 1px solid var(--ads-v2-color-border-emphasis-plus);
    transform: rotate(45deg);
  }
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

  const [isToggleActive, setIsToggleActive] = useState(false);

  const filteredRoles = useMemo(
    () => (isToggleActive ? roles : roles?.filter((role) => !role.autoCreated)),
    [isToggleActive, roles],
  );

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
      setData(filteredRoles);
    }
  }, [filteredRoles]);

  useEffect(() => {
    setSelectedRole(selectedRoleProps);
  }, [selectedRoleProps]);

  useEffect(() => {
    if (selectedRoleId && selectedRoleProps?.id !== selectedRoleId) {
      setSelectedRole(null);
      dispatch(getRoleById({ id: selectedRoleId }));
    } else if (!selectedRoleId) {
      dispatch({ type: ReduxActionTypes.FETCH_ACL_ROLES });
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
        const data = cellProps.cell.row.original;
        return (
          <NoUnderLineLink
            data-testid="t--roles-cell"
            target="_self"
            to={adminSettingsCategoryUrl({
              category: SettingCategories.ROLES_LISTING,
              selected: data.id,
            })}
          >
            <CellContainer>
              <HighlightText highlight={searchValue} text={data.name} />
              {data.autoCreated && (
                <MoreInfoPill
                  data-testid="t--appsmith-badge"
                  isClosable={false}
                >
                  {createMessage(DEFAULT_ROLES_PILL)}
                </MoreInfoPill>
              )}
              <MoreInfoPill
                data-testid="t--appsmith-permission-icon"
                isClosable={false}
              >
                {isPermitted(
                  data?.userPermissions,
                  PERMISSION_TYPE.MANAGE_PERMISSIONGROUPS,
                ) ? (
                  <Icon data-testid="t--edit-icon" name="pencil-line" />
                ) : (
                  <CrossedEditIcon
                    data-testid="t--crossed-edit-icon"
                    name="pencil-line"
                  />
                )}
              </MoreInfoPill>
            </CellContainer>
          </NoUnderLineLink>
        );
      },
    },
  ];

  const listMenuItems: MenuItemProps[] = [
    {
      className: "edit-menu-item",
      icon: "pencil-line",
      onSelect: (e: React.MouseEvent, key: string) => {
        history.push(`/settings/roles/${key}`);
      },
      text: createMessage(ACL_EDIT),
      label: "edit",
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
  };

  const onSearch = debounce((search: string) => {
    if (search && search.trim().length > 0) {
      setSearchValue(search);
      const results =
        filteredRoles &&
        filteredRoles.filter(
          (role) => role.name?.toLocaleUpperCase().includes(search),
        );
      setData(results);
    } else {
      setSearchValue("");
      setData(filteredRoles);
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
    <AclWrapper
      className="roles-listing-wrapper"
      data-testid="t--roles-listing-wrapper"
    >
      {selectedRoleId ? (
        selectedRole ? (
          <RoleAddEdit onDelete={onDeleteHandler} selected={selectedRole} />
        ) : (
          <LoaderContainer>
            <Spinner size="lg" />
          </LoaderContainer>
        )
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
          <DefaultRolesToggle
            isToggleActive={isToggleActive}
            setIsToggleActive={setIsToggleActive}
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
