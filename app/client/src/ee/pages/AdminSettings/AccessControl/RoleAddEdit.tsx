import React, { useState } from "react";
import { useHistory, useParams } from "react-router";
import { PageHeader } from "./PageHeader";
import { debounce } from "lodash";
import {
  createMessage,
  ACL_DELETE,
  ACL_RENAME,
  SEARCH_PLACEHOLDER,
  ACL_EDIT_DESC,
} from "@appsmith/constants/messages";
import { BackButton } from "components/utils/helperComponents";
import type { MenuItemProps, RoleEditProps } from "./types";
import { updateRoleName } from "@appsmith/actions/aclActions";
import { useDispatch, useSelector } from "react-redux";
import { getRolePermissions } from "@appsmith/selectors/aclSelectors";
import {
  isPermitted,
  PERMISSION_TYPE,
} from "@appsmith/utils/permissionHelpers";
import RoleTabs from "./RolesTree";

export function RoleAddEdit(props: RoleEditProps) {
  const { selected } = props;
  const { isNew = false } = selected;
  const [searchValue, setSearchValue] = useState("");
  const history = useHistory();
  const dispatch = useDispatch();
  const params = useParams() as any;

  const userPermissions = useSelector(getRolePermissions);

  const canManageRole = isPermitted(
    userPermissions,
    PERMISSION_TYPE.MANAGE_PERMISSIONGROUPS,
  );

  const canDeleteRole = isPermitted(
    userPermissions,
    PERMISSION_TYPE.DELETE_PERMISSIONGROUPS,
  );

  const isNotDefaultUserRole = selected.name !== "Default Role For All Users";

  const onSearch = debounce((input: string) => {
    if (input.trim().length > 0) {
      setSearchValue(input);
    } else {
      setSearchValue("");
    }
  }, 300);

  const onDeleteHandler = () => {
    props.onDelete && props.onDelete(selected.id);
    history.push(`/settings/roles`);
  };

  const onEditTitle = (name: string) => {
    if (selected.name !== name) {
      dispatch(
        updateRoleName({
          id: selected.id || params.selected,
          name,
        }),
      );
    }
  };

  const onEditDesc = (desc: string) => {
    if (selected.description !== desc) {
      dispatch(
        updateRoleName({
          id: selected.id || params.selected,
          name: selected.name,
          description: desc,
        }),
      );
    }
  };

  const menuItems: MenuItemProps[] = [
    canManageRole &&
      isNotDefaultUserRole && {
        className: "rename-menu-item",
        icon: "pencil-line",
        text: createMessage(ACL_RENAME),
        label: "rename",
      },
    canManageRole &&
      isNotDefaultUserRole && {
        className: "rename-desc-menu-item",
        icon: "pencil-line",
        text: createMessage(ACL_EDIT_DESC),
        label: "rename-desc",
      },
    canDeleteRole && {
      className: "delete-menu-item",
      icon: "delete-bin-line",
      onSelect: () => onDeleteHandler(),
      text: createMessage(ACL_DELETE),
      label: "delete",
    },
  ].filter(Boolean) as MenuItemProps[];

  return (
    <div
      className="scrollable-wrapper role-edit-wrapper"
      data-testid="t--role-edit-wrapper"
    >
      <BackButton />
      <PageHeader
        description={selected.description}
        isEditingTitle={isNew}
        isHeaderEditable={canManageRole && isNotDefaultUserRole}
        onEditDesc={onEditDesc}
        onEditTitle={onEditTitle}
        onSearch={onSearch}
        pageMenuItems={menuItems}
        searchPlaceholder={createMessage(SEARCH_PLACEHOLDER)}
        searchValue={searchValue}
        title={selected.name || ""}
      />
      <RoleTabs searchValue={searchValue} selected={selected} />
    </div>
  );
}
