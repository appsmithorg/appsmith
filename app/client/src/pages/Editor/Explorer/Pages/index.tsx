import React, { useCallback, useMemo, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
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
} from "@appsmith/constants/messages";
import { Page } from "constants/ReduxActionConstants";
import { getNextEntityName } from "utils/AppsmithUtils";
import { extractCurrentDSL } from "utils/WidgetPropsUtils";
import { Position } from "@blueprintjs/core";
import TooltipComponent from "components/ads/Tooltip";
import { TOOLTIP_HOVER_ON_DELAY } from "constants/AppConstants";
import styled from "styled-components";
import PageContextMenu from "./PageContextMenu";
import { resolveAsSpaceChar } from "utils/helpers";
import { getExplorerPinned } from "selectors/explorerSelector";
import { setExplorerPinnedAction } from "actions/explorerActions";
import { selectAllPages } from "selectors/entitiesSelector";

const StyledEntity = styled(Entity)`
  &.pages {
    & > div:not(.t--entity-item) {
      max-height: 138px !important;
      overflow-y: auto !important;
    }
  }
  &.page .${EntityClassNames.PRE_RIGHT_ICON} {
    width: 20px;
    right: 0;
  }
  &.page:hover {
    & .${EntityClassNames.PRE_RIGHT_ICON} {
      display: none;
    }
  }
`;

function Pages() {
  const applicationId = useSelector(getCurrentApplicationId);
  const pages = useSelector(selectAllPages);
  const currentPageId = useSelector(getCurrentPageId);
  const pinned = useSelector(getExplorerPinned);
  const dispatch = useDispatch();

  useEffect(() => {
    document.getElementsByClassName("activePage")[0]?.scrollIntoView();
  }, [currentPageId]);

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

  const settingsIconWithTooltip = React.useMemo(
    () => (
      <TooltipComponent
        boundary="viewport"
        content={createMessage(PAGE_PROPERTIES_TOOLTIP)}
        hoverOpenDelay={TOOLTIP_HOVER_ON_DELAY}
        position={Position.BOTTOM}
      >
        {settingsIcon}
      </TooltipComponent>
    ),
    [],
  );

  /**
   * toggles the pinned state of sidebar
   */
  const onPin = useCallback(() => {
    dispatch(setExplorerPinnedAction(!pinned));
  }, [pinned, dispatch, setExplorerPinnedAction]);

  const onClickRightIcon = useCallback(() => {
    history.push(PAGE_LIST_EDITOR_URL(applicationId, currentPageId));
  }, [applicationId, currentPageId]);

  const onPageListSelection = React.useCallback(
    () => history.push(PAGE_LIST_EDITOR_URL(applicationId, currentPageId)),
    [applicationId, currentPageId],
  );

  const pageElements = useMemo(
    () =>
      pages.map((page) => {
        const icon = page.isDefault ? defaultPageIcon : pageIcon;
        const rightIcon = !!page.isHidden ? hiddenPageIcon : null;
        const isCurrentPage = currentPageId === page.pageId;
        const contextMenu = (
          <PageContextMenu
            applicationId={applicationId as string}
            className={EntityClassNames.CONTEXT_MENU}
            isDefaultPage={page.isDefault}
            isHidden={!!page.isHidden}
            key={page.pageId + "_context-menu"}
            name={page.pageName}
            pageId={page.pageId}
          />
        );

        return (
          <StyledEntity
            action={() => switchPage(page.pageId)}
            className={`page ${isCurrentPage && "activePage"}`}
            contextMenu={contextMenu}
            entityId={page.pageId}
            icon={icon}
            isDefaultExpanded={isCurrentPage}
            key={page.pageId}
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
      }),
    [pages, currentPageId, applicationId],
  );

  return (
    <StyledEntity
      action={onPageListSelection}
      addButtonHelptext={createMessage(ADD_PAGE_TOOLTIP)}
      alwaysShowRightIcon
      className="group pages"
      entityId="Pages"
      icon={""}
      isDefaultExpanded
      name="PAGES"
      onClickPreRightIcon={onPin}
      onClickRightIcon={onClickRightIcon}
      onCreate={createPageCallback}
      rightIcon={settingsIconWithTooltip}
      searchKeyword={""}
      step={0}
    >
      {pageElements}
    </StyledEntity>
  );
}

Pages.displayName = "Pages";

export default React.memo(Pages);
