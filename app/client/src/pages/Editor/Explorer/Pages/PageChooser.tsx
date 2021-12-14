import React, { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppState } from "reducers";
import {
  getCurrentApplicationId,
  getCurrentPageId,
} from "selectors/editorSelectors";
import Entity from "../Entity";
import history from "utils/history";
import { BUILDER_PAGE_URL, PAGE_LIST_EDITOR_URL } from "constants/routes";
import { createPage, updatePage } from "actions/pageActions";
import {
  hiddenPageIcon,
  pageIcon,
  defaultPageIcon,
  pageGroupIcon,
  settingsIcon,
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

function PageChooser() {
  const applicationId = useSelector(getCurrentApplicationId);
  const pages = useSelector((state: AppState) => {
    return state.entities.pageList.pages;
  });
  const currentPageId = useSelector(getCurrentPageId);
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

  return (
    <Entity
      action={() =>
        history.push(PAGE_LIST_EDITOR_URL(applicationId, currentPageId))
      }
      addButtonHelptext={createMessage(ADD_PAGE_TOOLTIP)}
      alwaysShowRightIcon
      className="group pages"
      entityId="Pages"
      icon={pageGroupIcon}
      isDefaultExpanded
      name="PAGES"
      onClickRightIcon={() => {
        history.push(PAGE_LIST_EDITOR_URL(applicationId, currentPageId));
      }}
      onCreate={createPageCallback}
      rightIcon={settingsIconWithTooltip}
      searchKeyword={""}
      step={-1}
    >
      {pages.map((page, key) => {
        const icon = page.isDefault ? defaultPageIcon : pageIcon;
        const rightIcon = !!page.isHidden ? hiddenPageIcon : null;
        const isCurrentPage = currentPageId === page.pageId;

        return (
          <Entity
            action={() => switchPage(page.pageId)}
            active={isCurrentPage}
            className="page"
            // contextMenu={contextMenu}
            entityId={page.pageId}
            icon={icon}
            isDefaultExpanded={isCurrentPage}
            key={key.toString()}
            name={page.pageName}
            // onNameEdit={resolveAsSpaceChar}
            rightIcon={rightIcon}
            searchKeyword={""}
            step={0}
            updateEntityName={(id, name) =>
              updatePage(id, name, !!page.isHidden)
            }
          />
        );
      })}
    </Entity>
  );
}

PageChooser.displayName = "PageChooser";

export default PageChooser;
