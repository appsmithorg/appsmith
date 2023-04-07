import React, { useCallback, useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import { useFilteredFileOperations } from "components/editorComponents/GlobalSearch/GlobalSearchHooks";
import {
  comboHelpText,
  SEARCH_CATEGORY_ID,
  SEARCH_ITEM_TYPES,
} from "components/editorComponents/GlobalSearch/utils";
import { useSelector } from "react-redux";
import { getPagePermissions } from "selectors/editorSelectors";
import EntityAddButton from "../Entity/AddButton";
import { ReactComponent as SearchIcon } from "assets/icons/ads/search.svg";
import { ReactComponent as CrossIcon } from "assets/icons/ads/cross.svg";
import keyBy from "lodash/keyBy";
import type { AppState } from "@appsmith/reducers";
import { EntityIcon, getPluginIcon } from "../ExplorerIcons";
import { AddButtonWrapper, EntityClassNames } from "../Entity";
import {
  ADD_QUERY_JS_TOOLTIP,
  createMessage,
} from "@appsmith/constants/messages";
import { useCloseMenuOnScroll } from "../hooks";
import { SIDEBAR_ID } from "constants/Explorer";
import { hasCreateActionPermission } from "@appsmith/utils/permissionHelpers";
import {
  Menu,
  MenuContent,
  MenuItem,
  MenuTrigger,
  Tooltip,
} from "design-system";

const SubMenuContainer = styled.div`
  width: 250px;
  .ops-container {
    max-height: 220px;
    overflow: hidden;
    overflow-y: auto;
  }
`;

type SubMenuProps = {
  className: string;
  openMenu: boolean;
  onMenuClose: () => void;
};

export default function ExplorerSubMenu({
  className,
  onMenuClose,
  openMenu,
}: SubMenuProps) {
  const [query, setQuery] = useState("");
  const [show, setShow] = useState(openMenu);
  const fileOperations = useFilteredFileOperations(query);
  const filteredFileOperations = fileOperations.filter(
    (item: any) => item.kind !== SEARCH_ITEM_TYPES.sectionTitle,
  );
  const plugins = useSelector((state: AppState) => {
    return state.entities.plugins.list;
  });
  const pluginGroups = useMemo(() => keyBy(plugins, "id"), [plugins]);
  useEffect(() => handleOpenChange(openMenu), [openMenu]);
  useCloseMenuOnScroll(SIDEBAR_ID, show, () => handleOpenChange(false));

  const pagePermissions = useSelector(getPagePermissions);

  const canCreateActions = hasCreateActionPermission(pagePermissions);

  useEffect(() => {
    setQuery("");
  }, [show]);

  const onChange = useCallback((e) => {
    setQuery(e.target.value);
  }, []);

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
        {canCreateActions && (
          <Tooltip
            content={
              (
                <>
                  {createMessage(ADD_QUERY_JS_TOOLTIP)} (
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
      >
        <SubMenuContainer
          className={`bg-white overflow-y-auto overflow-x-hidden flex flex-col justify-start z-10 delay-150 transition-all ${EntityClassNames.CONTEXT_MENU_CONTENT}`}
        >
          <div className="px-4 py-2 text-sm font-medium text-gray">
            Create New
          </div>
          <div className="flex items-center space-x-2 px-4">
            <SearchIcon className="box-content w-4 h-4" />
            <input
              autoComplete="off"
              autoFocus
              className="flex-grow text-sm py-2 text-gray-800 bg-transparent placeholder-trueGray-500"
              onChange={onChange}
              placeholder="Search datasources"
              type="text"
              value={query}
            />
            {query && (
              <button
                className="p-1 hover:bg-trueGray-200"
                onClick={() => setQuery("")}
              >
                <CrossIcon className="w-3 h-3 text-trueGray-100" />
              </button>
            )}
          </div>
          <div className="ops-container">
            {filteredFileOperations.map((item: any, idx: number) => {
              const icon =
                item.icon ||
                (item.pluginId && (
                  <EntityIcon>
                    {getPluginIcon(pluginGroups[item.pluginId])}
                  </EntityIcon>
                ));

              return (
                <MenuItem key={`file-op-${idx}`}>
                  <div className="flex gap-2 items-center">
                    {icon && <span className="flex-shrink-0">{icon}</span>}
                    <span className="overflow-hidden whitespace-nowrap overflow-ellipsis">
                      {item.shortTitle || item.title}
                    </span>
                  </div>
                </MenuItem>
              );
            })}
          </div>
        </SubMenuContainer>
      </MenuContent>
    </Menu>
  );
}
