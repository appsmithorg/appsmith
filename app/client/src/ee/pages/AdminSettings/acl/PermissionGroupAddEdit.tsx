import React, { useState } from "react";
import { useHistory } from "react-router";
import { MenuItemProps } from "components/ads";
import { TabComponent, TabProp } from "components/ads/Tabs";
import { PageHeader } from "./PageHeader";
import { BackButton, TabsWrapper } from "./components";
import { debounce } from "lodash";

export type PermissionGroupProps = {
  isEditing: boolean;
  isDeleting: boolean;
  permissionName: string;
  isAppsmithProvided: boolean;
  id: string;
};

export type PermissionGroupEditProps = {
  selected: PermissionGroupProps;
  onClone: any;
  onDelete: any;
};

export function PermissionGroupAddEdit(props: PermissionGroupEditProps) {
  const [selectedTabIndex, setSelectedTabIndex] = useState(0);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const history = useHistory();

  /*const onButtonClick = () => {
    console.log("hello onClickHandler");
  };*/

  const onSearch = debounce(
    (/*search: string*/) => {
      // if (search && search.trim().length > 0) {
      //   setSearchValue(search);
      //   const results =
      //     userTableData &&
      //     userTableData.filter((user) =>
      //       user.username?.toLocaleUpperCase().includes(search),
      //     );
      //   setData(results);
      // } else {
      //   setSearchValue("");
      //   setData(userTableData);
      // }
    },
    300,
  );

  const { selected } = props;
  const tabs: TabProp[] = [
    {
      key: "application-resources",
      title: "Application Resources",
      panelComponent: <div>TAB</div>,
    },
    {
      key: "database-queries",
      title: "Datasources & Queries",
      panelComponent: <div>TAB</div>,
    },
    {
      key: "user-permission-groups",
      title: "User & Permission Groups",
      panelComponent: <div>TAB</div>,
    },
    {
      key: "others",
      title: "Others",
      panelComponent: <div>TAB</div>,
    },
  ];

  const onDeleteHanlder = () => {
    props.onDelete && props.onDelete(selected.id);
    history.push(`/settings/permission-groups`);
  };

  const onCloneHandler = () => {
    props.onClone && props.onClone(selected);
    history.push(`/settings/permission-groups`);
  };

  const menuItems: MenuItemProps[] = [
    {
      className: "clone-menu-item",
      icon: "duplicate",
      onSelect: () => onCloneHandler(),
      text: "Clone Permission Group",
    },
    {
      className: "rename-menu-item",
      icon: "edit-underline",
      onSelect: () => setIsEditingTitle(true),
      text: "Rename Permission Group",
      label: "rename",
    },
    {
      className: "delete-menu-item",
      icon: "delete-blank",
      onSelect: () => onDeleteHanlder(),
      text: "Delete Permission Group",
    },
  ];

  return (
    <div data-testid="t--permission-edit-wrapper">
      <BackButton />
      <PageHeader
        isEditingTitle={isEditingTitle}
        isTitleEditable
        onSearch={onSearch}
        pageMenuItems={menuItems}
        searchPlaceholder="Search"
        title={selected.permissionName}
      />
      <TabsWrapper>
        <TabComponent
          onSelect={setSelectedTabIndex}
          selectedIndex={selectedTabIndex}
          tabs={tabs}
        />
      </TabsWrapper>
    </div>
  );
}
