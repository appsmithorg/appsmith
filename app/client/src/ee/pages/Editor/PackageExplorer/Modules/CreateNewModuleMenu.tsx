import React, { useCallback, useState } from "react";

import { MODULE_TYPE } from "@appsmith/constants/ModuleConstants";
import {
  Menu,
  MenuContent,
  MenuItem,
  MenuSub,
  MenuSubContent,
  MenuSubTrigger,
  MenuTrigger,
  Tooltip,
} from "design-system";
import { kebabCase } from "lodash";
import { ExplorerMenuContent } from "pages/Editor/Explorer/Files/Submenu";
import { useFilteredFileOperations } from "./hooks/getFilteredFileOps";
import type { ActionOperation } from "components/editorComponents/GlobalSearch/utils";
import { SEARCH_ITEM_TYPES } from "components/editorComponents/GlobalSearch/utils";
import { getCurrentPackageId } from "@appsmith/selectors/packageSelectors";
import { useDispatch, useSelector } from "react-redux";
import type { EventLocation } from "@appsmith/utils/analyticsUtilTypes";
import { DatasourceCreateEntryPoints } from "constants/Datasource";
import { createJSModule } from "@appsmith/actions/moduleActions";
import {
  ADD_MODULE_TOOLTIP,
  createMessage,
} from "@appsmith/constants/messages";

interface QuerySubMenuProps {
  closeMenu: () => void;
}

interface CreateNewModuleMenuProps {
  triggerElement: React.ReactElement;
  canCreate: boolean;
  isOpen: boolean;
  closeMenu: () => void;
}

const MENU_ITEMS = [
  {
    title: "Query Module",
    type: MODULE_TYPE.QUERY,
  },
  {
    title: "JS Module",
    action: (packageId: string) => {
      return createJSModule({
        packageId,
        from: DatasourceCreateEntryPoints.SUBMENU,
      });
    },
    type: MODULE_TYPE.JS,
  },
];

function QuerySubMenu({ closeMenu }: QuerySubMenuProps) {
  const packageId = useSelector(getCurrentPackageId) || "";
  const [query, setQuery] = useState("");
  const fileOperations = useFilteredFileOperations(query);
  const dispatch = useDispatch();

  const handleClick = useCallback(
    (item: ActionOperation) => {
      if (item.kind === SEARCH_ITEM_TYPES.sectionTitle) return;
      if (item.action) {
        dispatch(
          item.action(
            packageId,
            DatasourceCreateEntryPoints.SUBMENU as EventLocation,
          ),
        );
      } else if (item.redirect) {
        item.redirect(
          packageId,
          DatasourceCreateEntryPoints.SUBMENU as EventLocation,
        );
      }
      closeMenu();
    },
    [packageId],
  );

  return (
    <ExplorerMenuContent
      fileOperations={fileOperations}
      handleClick={handleClick}
      query={query}
      setQuery={setQuery}
    />
  );
}

function CreateNewModuleMenu({
  canCreate,
  closeMenu,
  isOpen,
  triggerElement,
}: CreateNewModuleMenuProps) {
  const dispatch = useDispatch();
  const packageId = useSelector(getCurrentPackageId) || "";

  return (
    <Menu open={isOpen}>
      <MenuTrigger asChild={false}>
        {canCreate && (
          <Tooltip
            content={createMessage(ADD_MODULE_TOOLTIP)}
            placement="right"
          >
            {triggerElement}
          </Tooltip>
        )}
      </MenuTrigger>
      <MenuContent
        align="start"
        onInteractOutside={closeMenu}
        side="right"
        width="235px"
      >
        {MENU_ITEMS.map(({ action, title, type }) => {
          switch (type) {
            case MODULE_TYPE.QUERY:
              return (
                <MenuSub
                  data-testid={`t--editor-menu-${kebabCase(title)}`}
                  key={type}
                >
                  <MenuSubTrigger>{title}</MenuSubTrigger>
                  <MenuSubContent>
                    <QuerySubMenu closeMenu={closeMenu} />
                  </MenuSubContent>
                </MenuSub>
              );
            default:
              return (
                <MenuItem
                  data-testid={`t--add-module-menu-${kebabCase(title)}`}
                  key={type}
                  onClick={() => {
                    dispatch(action?.(packageId));
                    closeMenu();
                  }}
                >
                  {title}
                </MenuItem>
              );
          }
        })}
      </MenuContent>
    </Menu>
  );
}

export default CreateNewModuleMenu;
