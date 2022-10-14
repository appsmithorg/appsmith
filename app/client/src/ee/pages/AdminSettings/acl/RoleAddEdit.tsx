import React, { useEffect, useState } from "react";
import { useHistory } from "react-router";
import { Variant } from "components/ads";
import { MenuItemProps, TabComponent, TabProp, Toaster } from "design-system";
import { PageHeader } from "./PageHeader";
import { TabsWrapper } from "./components";
import { debounce } from "lodash";
import RolesTree from "./RolesTree";
import {
  createMessage,
  DELETE_ROLE,
  RENAME_ROLE,
  RENAME_SUCCESSFUL,
  SEARCH_PLACEHOLDER,
} from "@appsmith/constants/messages";
import { BackButton } from "components/utils/helperComponents";
import { LoaderContainer } from "pages/Settings/components";
import { Spinner } from "@blueprintjs/core";
import { RoleEditProps } from "./types";

export function EachTab(key: string, searchValue: string, value: any) {
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
        searchValue={searchValue}
        tabData={value}
        updateTabCount={(n) => setTabCount(n)}
      />
    ),
  };
}

export function RoleAddEdit(props: RoleEditProps) {
  const { isLoading, selected } = props;
  const [selectedTabIndex, setSelectedTabIndex] = useState(0);
  const [pageTitle, setPageTitle] = useState(selected?.name || "");
  const [searchValue, setSearchValue] = useState("");
  const history = useHistory();

  useEffect(() => {
    setPageTitle(selected?.name || "");
  }, [selected]);

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
    setPageTitle(name);
    Toaster.show({
      text: createMessage(RENAME_SUCCESSFUL),
      variant: Variant.success,
    });
  };

  const menuItems: MenuItemProps[] = [
    {
      className: "rename-menu-item",
      icon: "edit-underline",
      text: createMessage(RENAME_ROLE),
      label: "rename",
    },
    {
      className: "delete-menu-item",
      icon: "delete-blank",
      onSelect: () => onDeleteHandler(),
      text: createMessage(DELETE_ROLE),
      label: "delete",
    },
  ];

  const tabs: TabProp[] = selected?.tabs
    ? Object.entries(selected?.tabs).map(([key, value]) =>
        EachTab(key, searchValue, value),
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
        isEditingTitle={selected?.new || false}
        isTitleEditable
        onEditTitle={onEditTitle}
        onSearch={onSearch}
        pageMenuItems={menuItems}
        searchPlaceholder={createMessage(SEARCH_PLACEHOLDER)}
        title={pageTitle}
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
