import React, { useEffect, useState } from "react";
import { useHistory, useParams } from "react-router";
import { MenuItemProps, TabComponent, TabProp } from "design-system";
import { PageHeader } from "./PageHeader";
import { TabsWrapper } from "./components";
import { debounce } from "lodash";
import RolesTree from "./RolesTree";
import {
  createMessage,
  ACL_DELETE,
  ACL_RENAME,
  SEARCH_PLACEHOLDER,
} from "@appsmith/constants/messages";
import { BackButton } from "components/utils/helperComponents";
import { LoaderContainer } from "pages/Settings/components";
import { Spinner } from "@blueprintjs/core";
import { RoleEditProps } from "./types";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import { useDispatch } from "react-redux";
import { updateRoleName } from "@appsmith/actions/aclActions";

export function EachTab(
  key: string,
  searchValue: string,
  value: any,
  roleId: string,
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
        tabData={value}
        updateTabCount={(n) => setTabCount(n)}
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

  const menuItems: MenuItemProps[] = [
    {
      className: "rename-menu-item",
      icon: "edit-underline",
      text: createMessage(ACL_RENAME),
      label: "rename",
    },
    {
      className: "delete-menu-item",
      icon: "delete-blank",
      onSelect: () => onDeleteHandler(),
      text: createMessage(ACL_DELETE),
      label: "delete",
    },
  ];

  const tabs: TabProp[] = selected?.tabs
    ? Object.entries(selected?.tabs).map(([key, value]) =>
        EachTab(key, searchValue, value, selected.id),
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
        isEditingTitle={isNew}
        isTitleEditable
        onEditTitle={onEditTitle}
        onSearch={onSearch}
        pageMenuItems={menuItems}
        searchPlaceholder={createMessage(SEARCH_PLACEHOLDER)}
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
