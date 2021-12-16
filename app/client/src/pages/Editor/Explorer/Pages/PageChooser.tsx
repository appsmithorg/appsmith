import React, { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppState } from "reducers";
import {
  getCurrentApplicationId,
  getCurrentPageId,
} from "selectors/editorSelectors";
import Entity, { EntityClassNames } from "../Entity";
import history from "utils/history";
import { BUILDER_PAGE_URL, PAGE_LIST_EDITOR_URL } from "constants/routes";
import { createPage, updatePage } from "actions/pageActions";
import {
  hiddenPageIcon,
  pageIcon,
  defaultPageIcon,
  settingsIcon,
  currentPageIcon,
} from "../ExplorerIcons";
import {
  createMessage,
  ADD_PAGE_TOOLTIP,
  PAGE_PROPERTIES_TOOLTIP,
} from "constants/messages";
import { Page } from "constants/ReduxActionConstants";
import { getNextEntityName } from "utils/AppsmithUtils";
import { extractCurrentDSL } from "utils/WidgetPropsUtils";
import { Position } from "@blueprintjs/core";
import TooltipComponent from "components/ads/Tooltip";
import { TOOLTIP_HOVER_ON_DELAY } from "constants/AppConstants";
import styled from "styled-components";
import PageContextMenu from "./PageContextMenu";
import { resolveAsSpaceChar } from "utils/helpers";
import { ReactComponent as PinIcon } from "assets/icons/ads/double-arrow-left.svg";
import classNames from "classnames";
import { getExplorerPinned } from "selectors/explorerSelector";
import { setExplorerPinnedAction } from "actions/explorerActions";
import { Colors } from "constants/Colors";

const StyledEntity = styled(Entity)`
  &.pages {
    & > div:not(.t--entity-item) {
      max-height: 148px !important;
      overflow-y: auto !important;
    }
  }
  &.page .${EntityClassNames.PRE_RIGHT_ICON} {
    position: absolute;
    width: 20px;
    right: 0;
  }
  &.page:hover {
    & .${EntityClassNames.PRE_RIGHT_ICON} {
      display: none;
    }
  }
`;

const PinButtonWrapper = styled.div`
  & {
    svg {
      path {
        fill: ${Colors.CODE_GRAY};
      }
    }
  }
  &:hover {
    background-color: ${Colors.SHARK2};
    svg {
      path {
        fill: ${Colors.WHITE};
      }
    }
  }
`;

const StyledPinIcon = styled(PinIcon)`
  && {
    width: 12px;
    height: 12px;
  }
`;

function PageChooser() {
  const applicationId = useSelector(getCurrentApplicationId);
  const pages = useSelector((state: AppState) => {
    return state.entities.pageList.pages;
  });
  const currentPageId = useSelector(getCurrentPageId);
  const pinned = useSelector(getExplorerPinned);
  const dispatch = useDispatch();

  const switchPage = useCallback(
    (pageId) => {
      if (!!applicationId) {
        history.push(BUILDER_PAGE_URL({ applicationId, pageId }));
      }
    },
    [applicationId],
  );

  const createPageCallback = useCallback(() => {
    const name = getNextEntityName(
      "Page",
      pages.map((page: Page) => page.pageName),
    );
    // Default layout is extracted by adding dynamically computed properties like min-height.
    const defaultPageLayouts = [
      { dsl: extractCurrentDSL(), layoutOnLoadActions: [] },
    ];
    dispatch(createPage(applicationId, name, defaultPageLayouts));
  }, [dispatch, pages, applicationId]);

  const settingsIconWithTooltip = (
    <TooltipComponent
      boundary="viewport"
      content={createMessage(PAGE_PROPERTIES_TOOLTIP)}
      hoverOpenDelay={TOOLTIP_HOVER_ON_DELAY}
      position={Position.BOTTOM}
    >
      {settingsIcon}
    </TooltipComponent>
  );

  /**
   * toggles the pinned state of sidebar
   */
  const onPin = useCallback(() => {
    dispatch(setExplorerPinnedAction(!pinned));
  }, [pinned, dispatch, setExplorerPinnedAction]);

  const sidebarCloseIcon = (
    <PinButtonWrapper
      className={classNames({
        "h-full items-center transition-all duration-300 transform px-2 flex justify-center": true,
      })}
    >
      <TooltipComponent
        content={
          <div className="flex items-center justify-between">
            <span>Close sidebar</span>
            <span className="ml-4 text-xs text-gray-300">Ctrl + /</span>
          </div>
        }
      >
        <StyledPinIcon />
      </TooltipComponent>
    </PinButtonWrapper>
  );

  return (
    <StyledEntity
      action={() =>
        history.push(PAGE_LIST_EDITOR_URL(applicationId, currentPageId))
      }
      addButtonHelptext={createMessage(ADD_PAGE_TOOLTIP)}
      alwaysShowRightIcon
      className="group pages"
      disabled
      entityId="Pages"
      icon={""}
      isDefaultExpanded
      name="PAGES"
      onClickPreRightIcon={onPin}
      onClickRightIcon={() => {
        history.push(PAGE_LIST_EDITOR_URL(applicationId, currentPageId));
      }}
      onCreate={createPageCallback}
      preRightIcon={sidebarCloseIcon}
      rightIcon={settingsIconWithTooltip}
      searchKeyword={""}
      step={0}
    >
      {pages.map((page, key) => {
        const icon = page.isDefault ? defaultPageIcon : pageIcon;
        const rightIcon = !!page.isHidden ? hiddenPageIcon : null;
        const isCurrentPage = currentPageId === page.pageId;
        const contextMenu = (
          <PageContextMenu
            applicationId={applicationId as string}
            className={EntityClassNames.CONTEXT_MENU}
            isDefaultPage={page.isDefault}
            isHidden={!!page.isHidden}
            key={page.pageId}
            name={page.pageName}
            pageId={page.pageId}
          />
        );

        return (
          <StyledEntity
            action={() => switchPage(page.pageId)}
            className="page"
            contextMenu={contextMenu}
            entityId={page.pageId}
            icon={icon}
            isDefaultExpanded={isCurrentPage}
            key={key.toString()}
            name={page.pageName}
            onNameEdit={resolveAsSpaceChar}
            preRightIcon={isCurrentPage ? currentPageIcon : ""}
            rightIcon={rightIcon}
            searchKeyword={""}
            step={1}
            updateEntityName={(id, name) =>
              updatePage(id, name, !!page.isHidden)
            }
          />
        );
      })}
    </StyledEntity>
  );
}

PageChooser.displayName = "PageChooser";

export default PageChooser;
