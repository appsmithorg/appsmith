import React, { useCallback, useState } from "react";
import styled from "styled-components";
import { Button, Icon, Text } from "design-system";
import { useDispatch, useSelector } from "react-redux";
import {
  getCurrentApplicationId,
  getCurrentPageId,
  getCurrentPageName,
  getPageList,
} from "../../../selectors/editorSelectors";
import Entity from "../../Editor/Explorer/Entity";
import { defaultPageIcon, pageIcon } from "../../Editor/Explorer/ExplorerIcons";
import type { Page } from "@appsmith/constants/ReduxActionConstants";
import { selectAllPages } from "../../../selectors/entitiesSelector";
import { getCurrentWorkspaceId } from "@appsmith/selectors/workspaceSelectors";
import { getInstanceId } from "@appsmith/selectors/tenantSelectors";
import { getNextEntityName } from "../../../utils/AppsmithUtils";
import {
  createNewPageFromEntities,
  fetchPage,
  updateCurrentPage,
} from "../../../actions/pageActions";
import { builderURL } from "../../../RouteBuilder";
import { IDEAppState } from "../ideReducer";
import { toggleInOnboardingWidgetSelection } from "../../../actions/onboardingActions";
import history, { NavigationMethod } from "../../../utils/history";
import { getIdeSidebarWidth } from "../ideSelector";

const Container = styled.div`
  background-color: white;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  border-radius: 4px;
`;

const SwitchMode = styled.div`
  display: grid;
  grid-template-columns: 1fr 40px;
  background-color: #fbe6dc;
  flex: 1;
  height: 100%;
  align-items: center;
  padding: 5px;
  border-radius: 4px;
`;

const PageList = styled.div`
  height: 100%;
  background-color: white;
`;

const PageSwitchOverlay = styled.div<{ width: number }>`
  background-color: white;
  position: absolute;
  top: 0;
  left: 54px;
  width: ${(props) => props.width}px;
  bottom: 0;
`;

const PageSwitcher = () => {
  const dispatch = useDispatch();
  const currentPageName = useSelector(getCurrentPageName);
  const pageList = useSelector(getPageList);
  const currentPageId = useSelector(getCurrentPageId);
  const applicationId = useSelector(getCurrentApplicationId);
  const pages: Page[] = useSelector(selectAllPages);
  const workspaceId = useSelector(getCurrentWorkspaceId);
  const instanceId = useSelector(getInstanceId);
  const paneWidth = useSelector(getIdeSidebarWidth);
  const [isSwitchMode, setSwitchMode] = useState(false);
  const createPageCallback = useCallback(() => {
    const name = getNextEntityName(
      "Page",
      pages.map((page: Page) => page.pageName),
    );

    dispatch(
      createNewPageFromEntities(
        applicationId,
        name,
        workspaceId,
        false,
        instanceId,
      ),
    );
    setSwitchMode(false);
  }, [dispatch, pages, applicationId]);
  const switchPage = useCallback(
    (page: Page) => {
      const navigateToUrl = builderURL({
        pageId: page.pageId,
        ideState: IDEAppState.Page,
        suffix: "/ui",
      });
      dispatch(toggleInOnboardingWidgetSelection(true));
      dispatch(updateCurrentPage(page.pageId));
      dispatch(fetchPage(page.pageId));
      history.push(navigateToUrl, {
        invokedBy: NavigationMethod.EntityExplorer,
      });
      setSwitchMode(false);
    },
    [location.pathname],
  );
  if (isSwitchMode) {
    return (
      <PageSwitchOverlay width={paneWidth}>
        <SwitchMode>
          <Text kind="heading-s">Pages({pageList.length})</Text>
          <Button
            endIcon="cross"
            kind="tertiary"
            onClick={() => setSwitchMode(false)}
            size="sm"
          />
        </SwitchMode>
        <PageList>
          <Entity
            action={createPageCallback}
            canEditEntityName={false}
            className={`page`}
            entityId={"new"}
            icon={<Icon name="plus" />}
            name={"New Page"}
            searchKeyword={""}
            step={1}
          />
          {pages.map((page) => {
            const icon = page.isDefault ? defaultPageIcon : pageIcon;
            const isCurrentPage = currentPageId === page.pageId;
            return (
              <Entity
                action={() => switchPage(page)}
                active={isCurrentPage}
                canEditEntityName={false}
                className={`page ${isCurrentPage && "activePage"}`}
                disabled={page.isHidden}
                entityId={"new"}
                icon={icon}
                key={page.pageId}
                name={page.pageName}
                step={1}
              />
            );
          })}
        </PageList>
      </PageSwitchOverlay>
    );
  } else {
    return (
      <Container>
        <Button
          endIcon="arrow-down-s-line"
          kind="tertiary"
          onClick={() => setSwitchMode(true)}
          size="md"
          startIcon={"page-line"}
        >
          {currentPageName}
        </Button>
      </Container>
    );
  }
};

export default PageSwitcher;
