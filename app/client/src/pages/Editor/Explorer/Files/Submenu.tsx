import React, { useCallback, useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import { useFilteredFileOperations } from "components/editorComponents/GlobalSearch/GlobalSearchHooks";
import {
  comboHelpText,
  SEARCH_CATEGORY_ID,
  SEARCH_ITEM_TYPES,
} from "components/editorComponents/GlobalSearch/utils";
import { useDispatch, useSelector } from "react-redux";
import {
  getCurrentPageId,
  getPagePermissions,
} from "selectors/editorSelectors";
import EntityAddButton from "../Entity/AddButton";
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
  SearchInput,
  Text,
} from "design-system";
import { DatasourceCreateEntryPoints } from "constants/Datasource";

const SubMenuContainer = styled.div`
  width: 250px;
  .ops-container {
    max-height: 250px;
    overflow: hidden;
    overflow-y: auto;
    padding-top: 4px;
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

  const pageId = useSelector(getCurrentPageId);
  const dispatch = useDispatch();
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

  const onChange = useCallback((value) => {
    setQuery(value);
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

  const handleClick = useCallback(
    (item: any) => {
      if (item.kind === SEARCH_ITEM_TYPES.sectionTitle) return;
      if (item.action) {
        dispatch(item.action(pageId, DatasourceCreateEntryPoints.SUBMENU));
      } else if (item.redirect) {
        item.redirect(pageId, DatasourceCreateEntryPoints.SUBMENU);
      }
      handleOpenChange(false);
    },
    [pageId, dispatch, handleOpenChange],
  );

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
        // Menu content has a max height which causes the whole content to scroll
        style={{ maxHeight: "unset" }}
      >
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
            {filteredFileOperations.map((item: any, idx: number) => {
              const icon =
                item.icon ||
                (item.pluginId && (
                  <EntityIcon>
                    {getPluginIcon(pluginGroups[item.pluginId])}
                  </EntityIcon>
                ));

              return (
                <MenuItem
                  data-testid="t--file-operation"
                  id={`file-op-${idx}`}
                  key={`file-op-${idx}`}
                  onClick={() => handleClick(item)}
                >
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
