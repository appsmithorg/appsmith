import React, { useEffect, useState } from "react";
import { MenuItemProps, TabComponent, TabProp } from "design-system";
import { useHistory, useParams } from "react-router";
import { PageHeader } from "./PageHeader";
import { TabsWrapper } from "./components";
import { debounce } from "lodash";
import RolesTree from "./RolesTree";
import {
  createMessage,
  ACL_DELETE,
  ACL_RENAME,
  SEARCH_PLACEHOLDER,
  ACL_EDIT_DESC,
} from "@appsmith/constants/messages";
import { BackButton } from "components/utils/helperComponents";
import { LoaderContainer } from "pages/Settings/components";
import { Spinner } from "@blueprintjs/core";
import { RoleEditProps } from "./types";
import { updateRoleName } from "@appsmith/actions/aclActions";
import { useDispatch, useSelector } from "react-redux";
import { getRolePermissions } from "@appsmith/selectors/aclSelectors";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import {
  isPermitted,
  PERMISSION_TYPE,
} from "@appsmith/utils/permissionHelpers";

export function EachTab(
  key: string,
  searchValue: string,
  tabs: any,
  roleId: string,
  userPermissions: string[],
) {
  const [tabCount, setTabCount] = useState<number>(0);

  useEffect(() => {
    if (!searchValue) {
      setTabCount(0);
    }
  }, [searchValue]);

  return {
    key,
    title: key,
    count: tabCount,
    panelComponent: (
      <RolesTree
        currentTabName={key}
        roleId={roleId}
        searchValue={searchValue}
        tabData={tabs}
        updateTabCount={(n) => setTabCount(n)}
        userPermissions={userPermissions}
      />
    ),
  };
}

export function RoleAddEdit(props: RoleEditProps) {
  const { isLoading, isNew = false, selected } = props;
  const [selectedTabIndex, setSelectedTabIndex] = useState(0);
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

  useEffect(() => {
    dispatch({
      type: ReduxActionTypes.FETCH_ICON_LOCATIONS,
    });
  }, []);

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
    canManageRole && {
      className: "rename-menu-item",
      icon: "edit-underline",
      text: createMessage(ACL_RENAME),
      label: "rename",
    },
    canManageRole && {
      className: "rename-desc-menu-item",
      icon: "edit-underline",
      text: createMessage(ACL_EDIT_DESC),
      label: "rename-desc",
    },
    canDeleteRole && {
      className: "delete-menu-item",
      icon: "delete-blank",
      onSelect: () => onDeleteHandler(),
      text: createMessage(ACL_DELETE),
      label: "delete",
    },
  ].filter(Boolean);

  const tabs: TabProp[] = selected?.tabs
    ? Object.entries(selected?.tabs).map(([key, value]) =>
        EachTab(
          key,
          searchValue,
          value,
          selected.id,
          selected.userPermissions ?? [],
        ),
      )
    : [];

  return isLoading ? (
    <LoaderContainer>
      <Spinner />
    </LoaderContainer>
  ) : (
    <div
      className="scrollable-wrapper role-edit-wrapper"
      data-testid="t--role-edit-wrapper"
    >
      <BackButton />
      <PageHeader
        description={selected.description}
        isEditingTitle={isNew}
        isHeaderEditable={canManageRole}
        onEditDesc={onEditDesc}
        onEditTitle={onEditTitle}
        onSearch={onSearch}
        pageMenuItems={menuItems}
        searchPlaceholder={createMessage(SEARCH_PLACEHOLDER)}
        searchValue={searchValue}
        title={selected.name || ""}
      />
      {tabs.length > 0 && (
        <TabsWrapper>
          <TabComponent
            onSelect={setSelectedTabIndex}
            selectedIndex={selectedTabIndex}
            tabs={tabs}
          />
        </TabsWrapper>
      )}
    </div>
  );
}
