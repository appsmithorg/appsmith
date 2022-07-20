import { Popover2 } from "@blueprintjs/popover2";
import { useFilteredFileOperations } from "components/editorComponents/GlobalSearch/GlobalSearchHooks";
import {
  comboHelpText,
  SEARCH_CATEGORY_ID,
  SEARCH_ITEM_TYPES,
} from "components/editorComponents/GlobalSearch/utils";
import styled from "constants/DefaultTheme";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getCurrentPageId } from "selectors/editorSelectors";
import EntityAddButton from "../Entity/AddButton";
import { ReactComponent as SearchIcon } from "assets/icons/ads/search.svg";
import { ReactComponent as CrossIcon } from "assets/icons/ads/cross.svg";
import classNames from "classnames";
import keyBy from "lodash/keyBy";
import { AppState } from "reducers";
import { EntityIcon, getPluginIcon } from "../ExplorerIcons";
import SubmenuHotKeys from "./SubmenuHotkeys";
import scrollIntoView from "scroll-into-view-if-needed";
import { Colors } from "constants/Colors";
import { TOOLTIP_HOVER_ON_DELAY } from "constants/AppConstants";
import { EntityClassNames } from "../Entity";
import { TooltipComponent } from "design-system";
import { ADD_QUERY_JS_BUTTON, createMessage } from "ce/constants/messages";

const SubMenuContainer = styled.div`
  width: 250px;
  .ops-container {
    scrollbar-width: none;
    -ms-overflow-style: none;
    &::-webkit-scrollbar {
      display: none;
      -webkit-appearance: none;
    }
    max-height: 220px;
    overflow: hidden;
    overflow-y: auto;
    div.active {
      background: ${Colors.GREY_2};
    }
    > div:not(.section-title) {
      &: hover {
        background: ${Colors.GREY_2};
      }
    }
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
  const pageId = useSelector(getCurrentPageId);
  const dispatch = useDispatch();
  const plugins = useSelector((state: AppState) => {
    return state.entities.plugins.list;
  });
  const pluginGroups = useMemo(() => keyBy(plugins, "id"), [plugins]);
  const [activeItemIdx, setActiveItemIdx] = useState(0);

  useEffect(() => setShow(openMenu), [openMenu]);

  useEffect(() => {
    setQuery("");
  }, [show]);

  useEffect(() => {
    const element = document.getElementById(`file-op-${activeItemIdx}`);
    if (element)
      scrollIntoView(element, {
        scrollMode: "if-needed",
      });
  }, [activeItemIdx]);

  const handleUpKey = useCallback(() => {
    setActiveItemIdx((currentActiveIndex) => {
      if (currentActiveIndex <= 0) return filteredFileOperations.length - 1;
      return Math.max(currentActiveIndex - 1, 0);
    });
  }, [filteredFileOperations]);

  const handleDownKey = useCallback(() => {
    setActiveItemIdx((currentActiveIndex) => {
      if (currentActiveIndex >= filteredFileOperations.length - 1) return 0;
      return Math.min(
        currentActiveIndex + 1,
        filteredFileOperations.length - 1,
      );
    });
  }, [filteredFileOperations]);

  const onChange = useCallback((e) => {
    setQuery(e.target.value);
  }, []);

  const handleSelect = () => {
    const item = filteredFileOperations[activeItemIdx];
    handleClick(item);
  };

  const handleClick = useCallback(
    (item: any) => {
      if (item.kind === SEARCH_ITEM_TYPES.sectionTitle) return;
      if (item.action) {
        dispatch(item.action(pageId, "SUBMENU"));
      } else if (item.redirect) {
        item.redirect(pageId, "SUBMENU");
      }
      setShow(false);
    },
    [pageId, dispatch, setShow],
  );

  return (
    <Popover2
      canEscapeKeyClose
      className="file-ops"
      content={
        <SubmenuHotKeys
          handleDownKey={handleDownKey}
          handleSubmitKey={handleSelect}
          handleUpKey={handleUpKey}
        >
          <SubMenuContainer className="bg-white overflow-y-auto overflow-x-hidden flex flex-col justify-start z-10 delay-150 transition-all">
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
                  <div
                    className={classNames({
                      "px-4 py-2 text-sm flex items-center gap-2 t--file-operation": true,
                      "cursor-pointer":
                        item.kind !== SEARCH_ITEM_TYPES.sectionTitle,
                      active:
                        activeItemIdx === idx &&
                        item.kind !== SEARCH_ITEM_TYPES.sectionTitle,
                      "font-medium text-gray section-title":
                        item.kind === SEARCH_ITEM_TYPES.sectionTitle,
                    })}
                    id={`file-op-${idx}`}
                    key={`file-op-${idx}`}
                    onClick={() => handleClick(item)}
                  >
                    {icon && <span className="flex-shrink-0">{icon}</span>}
                    <span className="overflow-hidden whitespace-nowrap overflow-ellipsis">
                      {item.shortTitle || item.title}
                    </span>
                  </div>
                );
              })}
            </div>
          </SubMenuContainer>
        </SubmenuHotKeys>
      }
      isOpen={show}
      minimal
      onClose={() => {
        setShow(false);
        onMenuClose();
      }}
      placement="right-start"
      transitionDuration={0}
    >
      <TooltipComponent
        boundary="viewport"
        className={EntityClassNames.TOOLTIP}
        content={
          <>
            {createMessage(ADD_QUERY_JS_BUTTON)} (
            {comboHelpText[SEARCH_CATEGORY_ID.ACTION_OPERATION]})
          </>
        }
        disabled={show}
        hoverOpenDelay={TOOLTIP_HOVER_ON_DELAY}
        position="right"
      >
        <EntityAddButton
          className={`${className} ${show ? "selected" : ""}`}
          onClick={() => setShow(true)}
        />
      </TooltipComponent>
    </Popover2>
  );
}
