import React, { useCallback, useMemo, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  getCurrentApplicationId,
  getCurrentPageId,
} from "selectors/editorSelectors";
import Entity, { EntityClassNames } from "../Entity";
import history from "utils/history";
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
import { Page } from "@appsmith/constants/ReduxActionConstants";
import { getNextEntityName } from "utils/AppsmithUtils";
import { extractCurrentDSL } from "utils/WidgetPropsUtils";
import { TooltipComponent } from "design-system";
import { TOOLTIP_HOVER_ON_DELAY } from "constants/AppConstants";
import styled from "styled-components";
import PageContextMenu from "./PageContextMenu";
import { resolveAsSpaceChar } from "utils/helpers";
import { getExplorerPinned } from "selectors/explorerSelector";
import { setExplorerPinnedAction } from "actions/explorerActions";
import { selectAllPages } from "selectors/entitiesSelector";
import { builderURL, pageListEditorURL } from "RouteBuilder";
import { saveExplorerStatus, getExplorerStatus } from "../helpers";
import { tailwindLayers } from "constants/Layers";
import useResize, {
  DIRECTION,
  CallbackResponseType,
} from "utils/hooks/useResize";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { useLocation } from "react-router";
import { toggleInOnboardingWidgetSelection } from "actions/onboardingActions";

const ENTITY_HEIGHT = 36;
const MIN_PAGES_HEIGHT = 60;

const StyledEntity = styled(Entity)<{ pagesSize?: number }>`
  &.pages {
    & > div:not(.t--entity-item) > div > div {
      max-height: 40vh;
      min-height: ${(props) =>
        props.pagesSize && props.pagesSize > MIN_PAGES_HEIGHT
          ? MIN_PAGES_HEIGHT
          : props.pagesSize}px;
      height: ${(props) =>
        props.pagesSize && props.pagesSize > 128 ? 128 : props.pagesSize}px;
      overflow-y: auto;
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

const RelativeContainer = styled.div`
  position: relative;
`;

function Pages() {
  const applicationId = useSelector(getCurrentApplicationId);
  const pages: Page[] = useSelector(selectAllPages);
  const currentPageId = useSelector(getCurrentPageId);
  const pinned = useSelector(getExplorerPinned);
  const dispatch = useDispatch();
  const isPagesOpen = getExplorerStatus(applicationId, "pages");
  const pageResizeRef = useRef<HTMLDivElement>(null);
  const storedHeightKey = "pagesContainerHeight_" + applicationId;
  const storedHeight = localStorage.getItem(storedHeightKey);
  const location = useLocation();

  const resizeAfterCallback = (data: CallbackResponseType) => {
    localStorage.setItem(storedHeightKey, data.height.toString());
  };

  const { mouseDown, setMouseDown } = useResize(
    pageResizeRef,
    DIRECTION.vertical,
    resizeAfterCallback,
  );

  useEffect(() => {
    document.getElementsByClassName("activePage")[0]?.scrollIntoView();
  }, [currentPageId]);

  useEffect(() => {
    if ((isPagesOpen === null ? true : isPagesOpen) && pageResizeRef.current) {
      pageResizeRef.current.style.height = storedHeight + "px";
    }
  }, [pageResizeRef]);

  const switchPage = useCallback(
    (page: Page) => {
      const navigateToUrl = builderURL({
        pageSlug: page.slug as string,
        pageId: page.pageId,
      });
      AnalyticsUtil.logEvent("PAGE_NAME_CLICK", {
        name: page.pageName,
        fromUrl: location.pathname,
        type: "PAGES",
        toUrl: navigateToUrl,
      });
      dispatch(toggleInOnboardingWidgetSelection(true));
      history.push(navigateToUrl);
    },
    [location.pathname],
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
        position="bottom"
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
    history.push(pageListEditorURL({ pageId: currentPageId }));
  }, [currentPageId]);

  const onPageListSelection = React.useCallback(
    () => history.push(pageListEditorURL({ pageId: currentPageId })),
    [currentPageId],
  );

  const onPageToggle = useCallback(
    (isOpen: boolean) => {
      saveExplorerStatus(applicationId, "pages", isOpen);
    },
    [applicationId],
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
            action={() => switchPage(page)}
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
    <RelativeContainer>
      <StyledEntity
        action={onPageListSelection}
        addButtonHelptext={createMessage(ADD_PAGE_TOOLTIP)}
        alwaysShowRightIcon
        className="group pages"
        collapseRef={pageResizeRef}
        entityId="Pages"
        icon={""}
        isDefaultExpanded={isPagesOpen === null ? true : isPagesOpen}
        name="PAGES"
        onClickPreRightIcon={onPin}
        onClickRightIcon={onClickRightIcon}
        onCreate={createPageCallback}
        onToggle={onPageToggle}
        pagesSize={ENTITY_HEIGHT * pages.length}
        rightIcon={settingsIconWithTooltip}
        searchKeyword={""}
        step={0}
      >
        {pageElements}
      </StyledEntity>
      <div
        className={`absolute -bottom-2 left-0 w-full h-2 group cursor-ns-resize ${tailwindLayers.resizer}`}
        onMouseDown={() => setMouseDown(true)}
      >
        <div
          className={`w-full h-1 bg-transparent hover:bg-gray-300 transform transition
          ${mouseDown ? "hover:bg-blue-500" : ""}
          `}
        />
      </div>
    </RelativeContainer>
  );
}

Pages.displayName = "Pages";

export default React.memo(Pages);
