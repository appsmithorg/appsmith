import React, { useEffect, useState } from "react";
import { useHistory } from "react-router";
import { MenuItemProps, Toaster, Variant } from "components/ads";
import { TabComponent, TabProp } from "components/ads/Tabs";
import { PageHeader } from "./PageHeader";
import { SaveButtonBar, TabsWrapper } from "./components";
import { debounce } from "lodash";
import RolesTree from "./RolesTree";
import { BackButton } from "pages/Settings/components";
import EmptyDataState from "components/utils/EmptyDataState";
import { response2 } from "./mocks/mockRoleTreeResponse";
import {
  createMessage,
  CLONE_ROLE,
  DELETE_ROLE,
  RENAME_ROLE,
  RENAME_SUCCESSFUL,
  SEARCH_PLACEHOLDER,
  SUCCESSFULLY_SAVED,
} from "@appsmith/constants/messages";

export type RoleProps = {
  isEditing: boolean;
  isDeleting: boolean;
  permissionName: string;
  isAppsmithProvided: boolean;
  id: string;
  isNew?: boolean;
};

export type RoleEditProps = {
  selected: RoleProps;
  onClone: any;
  onDelete: any;
};

export function RoleAddEdit(props: RoleEditProps) {
  const { selected } = props;
  const [selectedTabIndex, setSelectedTabIndex] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [pageTitle, setPageTitle] = useState(selected.permissionName);
  const [searchValue, setSearchValue] = useState("");
  const [filteredData, setFilteredData] = useState<any>([]);
  const history = useHistory();

  useEffect(() => {
    if (pageTitle !== selected.permissionName) {
      setIsSaving(true);
    } else {
      setIsSaving(false);
    }
  }, [pageTitle]);

  /*const onButtonClick = () => {
    console.log("hello onClickHandler");
  };*/

  const onSaveChanges = () => {
    Toaster.show({
      text: createMessage(SUCCESSFULLY_SAVED),
      variant: Variant.success,
    });
  };

  const onClearChanges = () => {
    setPageTitle(selected.permissionName);
  };

  function searchTree(
    tree: Record<string, any>[],
    value: string,
    key = "name",
  ) {
    const result: any = [];
    if (!Array.isArray(tree)) return result;
    for (let topIndex = 0; topIndex < tree.length; topIndex += 1) {
      const stack = [tree[topIndex]];

      while (stack.length) {
        const node = stack.shift();
        if (node && node[key].includes(value.toLocaleLowerCase())) {
          result.push(node);
        }
        if (node && node.subRows) {
          stack.push(...node.subRows);
        }
      }
    }
    return result;
  }

  const onSearch = debounce((input: string) => {
    if (input.trim().length > 0) {
      setSearchValue(input);
      const results: any = [];
      for (let i = 0; i < response2.length; i++) {
        const result = searchTree(response2[i].data, input);
        results[i] = {
          name: response2[i].name,
          data: result,
          count: result.length,
        };
      }
      setFilteredData(results);
    } else {
      setSearchValue("");
      setFilteredData([]);
    }
  }, 300);

  const tabs: TabProp[] = response2.map((tab: any, index: any) => {
    const count = searchValue && filteredData ? filteredData[index]?.count : 0;
    return {
      key: tab.name,
      title: tab.name,
      count: count,
      panelComponent:
        searchValue && count === 0 ? (
          <EmptyDataState />
        ) : (
          <RolesTree searchValue={searchValue} tabData={tab} />
        ),
    };
  });

  /*[
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
      title: "Groups & Roles",
      panelComponent: <div>TAB</div>,
    },
    {
      key: "others",
      title: "Others",
      panelComponent: <div>TAB</div>,
    },
  ];*/

  const onDeleteHandler = () => {
    props.onDelete && props.onDelete(selected.id);
    history.push(`/settings/roles`);
  };

  const onCloneHandler = () => {
    props.onClone && props.onClone(selected);
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
      className: "clone-menu-item",
      icon: "duplicate",
      onSelect: () => onCloneHandler(),
      text: createMessage(CLONE_ROLE),
      label: "clone",
    },
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

  return (
    <div data-testid="t--role-edit-wrapper">
      <BackButton />
      <PageHeader
        isEditingTitle={selected.isNew}
        isTitleEditable
        onEditTitle={onEditTitle}
        onSearch={onSearch}
        pageMenuItems={menuItems}
        searchPlaceholder={createMessage(SEARCH_PLACEHOLDER)}
        title={pageTitle}
      />
      <TabsWrapper>
        <TabComponent
          onSelect={setSelectedTabIndex}
          selectedIndex={selectedTabIndex}
          tabs={tabs}
        />
      </TabsWrapper>
      {isSaving && (
        <SaveButtonBar onClear={onClearChanges} onSave={onSaveChanges} />
      )}
    </div>
  );
}
