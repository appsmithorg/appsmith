import React, { useCallback, useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import type { ActionOperation } from "components/editorComponents/GlobalSearch/utils";
import {
  comboHelpText,
  SEARCH_CATEGORY_ID,
  SEARCH_ITEM_TYPES,
} from "components/editorComponents/GlobalSearch/utils";
import { useSelector } from "react-redux";
import EntityAddButton from "../Entity/AddButton";
import keyBy from "lodash/keyBy";
import type { AppState } from "ee/reducers";
import { EntityIcon, getPluginIcon } from "../ExplorerIcons";
import { AddButtonWrapper, EntityClassNames } from "../Entity";
import { useCloseMenuOnScroll } from "ee/pages/Editor/Explorer/hooks";
import { SIDEBAR_ID } from "constants/Explorer";
import {
  Menu,
  MenuContent,
  MenuItem,
  MenuTrigger,
  Tooltip,
  SearchInput,
  Text,
} from "@appsmith/ads";

const SubMenuContainer = styled.div`
  width: 250px;
  .ops-container {
    max-height: 250px;
    overflow: hidden;
    overflow-y: auto;
    padding-top: 4px;
  }
`;

interface SubMenuProps {
  canCreate: boolean;
  className: string;
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  handleClick: (item: any) => void;
  openMenu: boolean;
  onMenuClose: () => void;
  fileOperations: ActionOperation[] | undefined;
  setQuery: (val: string) => void;
  query: string;
  tooltipText: string;
}

type ExplorerMenuContentProps = Pick<
  SubMenuProps,
  "handleClick" | "query" | "fileOperations" | "setQuery"
> & {
  handleOpenChange?: (open: boolean) => void;
};

export function ExplorerMenuContent({
  fileOperations,
  handleClick,
  handleOpenChange,
  query,
  setQuery,
}: ExplorerMenuContentProps) {
  const filteredFileOperations = fileOperations?.filter(
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (item: any) => item.kind !== SEARCH_ITEM_TYPES.sectionTitle,
  );

  const plugins = useSelector((state: AppState) => {
    return state.entities.plugins.list;
  });
  const pluginGroups = useMemo(() => keyBy(plugins, "id"), [plugins]);

  const onChange = useCallback(
    (value) => {
      setQuery(value);
    },
    [setQuery],
  );

  return (
    <SubMenuContainer
      className={`overflow-y-auto overflow-x-hidden flex flex-col justify-start delay-150 transition-all ${EntityClassNames.CONTEXT_MENU_CONTENT}`}
      onKeyDown={(e) => {
        // This is to prevent the Menu component to take focus away from the input
        // https://github.com/radix-ui/primitives/issues/1175
        e.stopPropagation();
      }}
    >
      <div className="px-2 py-2">
        <Text kind="heading-xs">Create new</Text>
      </div>
      <SearchInput
        autoFocus
        data-testId="t--search-file-operation"
        onChange={onChange}
        placeholder="Search datasources"
        value={query}
      />
      <div className="ops-container">
        {/* TODO: Fix this the next time the file is edited */}
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        {filteredFileOperations?.map((item: any, idx: number) => {
          const icon =
            item.icon ||
            (item.pluginId && (
              <EntityIcon>
                {getPluginIcon(pluginGroups[item.pluginId])}
              </EntityIcon>
            ));

          const menuItem = (
            <div className="flex items-center gap-2">
              {icon && <span className="flex-shrink-0">{icon}</span>}
              <span className="overflow-hidden whitespace-nowrap overflow-ellipsis">
                {item.shortTitle || item.title}
              </span>
            </div>
          );

          return (
            <MenuItem
              data-testid="t--file-operation"
              id={`file-op-${idx}`}
              key={`file-op-${idx}`}
              onClick={() => {
                handleClick(item);
                handleOpenChange?.(false);
              }}
            >
              {item.tooltip ? (
                <Tooltip content={item.tooltip} placement="topRight">
                  {menuItem}
                </Tooltip>
              ) : (
                menuItem
              )}
            </MenuItem>
          );
        })}
      </div>
    </SubMenuContainer>
  );
}

export default function ExplorerSubMenu({
  canCreate,
  className,
  fileOperations,
  handleClick,
  onMenuClose,
  openMenu,
  query,
  setQuery,
  tooltipText,
}: SubMenuProps) {
  const [show, setShow] = useState(openMenu);

  useEffect(() => handleOpenChange(openMenu), [openMenu]);
  useCloseMenuOnScroll(SIDEBAR_ID, show, () => handleOpenChange(false));

  useEffect(() => {
    setQuery("");
  }, [show]);

  const handleOpenChange = (open: boolean) => {
    if (open) {
      // handle open
    } else {
      // handle close
      onMenuClose();
    }

    setShow(open);
  };

  return (
    <Menu open={show}>
      <MenuTrigger asChild={false}>
        {canCreate && (
          <Tooltip
            content={
              (
                <>
                  {tooltipText} (
                  {comboHelpText[SEARCH_CATEGORY_ID.ACTION_OPERATION]})
                </>
              ) as unknown as string
            }
            placement="right"
          >
            <AddButtonWrapper>
              <EntityAddButton
                className={`${className} ${show ? "selected" : ""}`}
                onClick={() => handleOpenChange(true)}
              />
            </AddButtonWrapper>
          </Tooltip>
        )}
      </MenuTrigger>
      <MenuContent
        align="start"
        onInteractOutside={() => handleOpenChange(false)}
        side="right"
        // Menu content has a max height which causes the whole content to scroll
        style={{ maxHeight: "unset" }}
      >
        <ExplorerMenuContent
          fileOperations={fileOperations}
          handleClick={handleClick}
          handleOpenChange={handleOpenChange}
          query={query}
          setQuery={setQuery}
        />
      </MenuContent>
    </Menu>
  );
}
