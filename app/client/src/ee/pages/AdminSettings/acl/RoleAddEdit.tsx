import React, { useEffect, useState } from "react";
import { useHistory } from "react-router";
import { Variant } from "components/ads";
import { MenuItemProps, TabComponent, TabProp, Toaster } from "design-system";
import { PageHeader } from "./PageHeader";
import { SaveButtonBar, TabsWrapper } from "./components";
import { debounce } from "lodash";
import RolesTree from "./RolesTree";
import { response2 } from "./mocks/mockRoleTreeResponse";
import {
  createMessage,
  DELETE_ROLE,
  RENAME_ROLE,
  RENAME_SUCCESSFUL,
  SEARCH_PLACEHOLDER,
  SUCCESSFULLY_SAVED,
} from "@appsmith/constants/messages";
import { BackButton } from "components/utils/helperComponents";
import { LoaderContainer } from "pages/Settings/components";
import { Spinner } from "@blueprintjs/core";
import { RoleEditProps } from "./types";

export function RoleAddEdit(props: RoleEditProps) {
  const { isLoading, selected } = props;
  const [selectedTabIndex, setSelectedTabIndex] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [pageTitle, setPageTitle] = useState(selected.name);
  const [searchValue, setSearchValue] = useState("");
  const [filteredData, setFilteredData] = useState<any>([]);
  const history = useHistory();

  useEffect(() => {
    setPageTitle(selected.name || "");
  }, [selected]);

  useEffect(() => {
    if (pageTitle !== selected.name) {
      setIsSaving(true);
    } else {
      setIsSaving(false);
    }
  }, [pageTitle]);

  const onSaveChanges = () => {
    Toaster.show({
      text: createMessage(SUCCESSFULLY_SAVED),
      variant: Variant.success,
    });
  };

  const onClearChanges = () => {
    setPageTitle(selected.name);
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

  const tabs: TabProp[] = response2.map((tab: any, index: any) => {
    const count = searchValue && filteredData ? filteredData[index]?.count : 0;
    return {
      key: tab.name,
      title: tab.name,
      count: count,
      panelComponent: (
        <RolesTree
          noData={searchValue !== "" && count === 0}
          searchValue={searchValue}
          tabData={tab}
        />
      ),
    };
  });

  return isLoading ? (
    <LoaderContainer>
      <Spinner />
    </LoaderContainer>
  ) : (
    <div className="scrollable-wrapper" data-testid="t--role-edit-wrapper">
      <BackButton />
      <PageHeader
        isEditingTitle={selected.new}
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
