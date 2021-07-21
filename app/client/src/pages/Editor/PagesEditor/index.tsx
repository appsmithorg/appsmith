import { get } from "lodash";
import styled, { useTheme } from "styled-components";
import { useParams, useHistory } from "react-router";
import { useDispatch, useSelector } from "react-redux";
import React, { useEffect, useCallback } from "react";

import {
  createPage,
  setPageOrder,
  setPageAsDefault,
} from "actions/pageActions";
import { AppState } from "reducers";
import { Action } from "./PageListItem";
import PageListItem from "./PageListItem";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { ControlIcons } from "icons/ControlIcons";
import { IconWrapper } from "components/ads/Icon";
import Button, { Size } from "components/ads/Button";
import { Page } from "constants/ReduxActionConstants";
import { getNextEntityName } from "utils/AppsmithUtils";
import DraggableList from "components/ads/DraggableList";
import { extractCurrentDSL } from "utils/WidgetPropsUtils";
import { ExplorerURLParams } from "pages/Editor/Explorer/helpers";
import { getCurrentApplication } from "selectors/applicationSelectors";
import { BUILDER_PAGE_URL } from "constants/routes";

const Wrapper = styled.div`
  padding: 20px;
  background-color: ${(props) => props.theme.colors.artboard};
  height: 100%;
  overflow: auto;
`;

const Header = styled.div`
  display: flex;
  padding-bottom: 20px;
  button {
    margin-left: auto;
  }

  & > div {
    display: flex;
    align-items: center;

    h1 {
      margin: 0;
      font-size: 18px;
      color: ${(props) => props.theme.colors.text.heading};
      margin-left: 10px;
    }
  }
`;

const NewPageButton = styled(Button)`
  & > ${IconWrapper} svg {
    margin-right: 4px;
    height: 11px;
    width: 11px;
  }

  & > ${IconWrapper} path {
    stroke: white !important;
  }
`;

const CloseIcon = ControlIcons.CLOSE_CONTROL;

function PagesEditor() {
  const theme = useTheme();
  const dispatch = useDispatch();
  const history = useHistory();
  const params = useParams<ExplorerURLParams>();
  const currentApp = useSelector(getCurrentApplication);
  const pages = useSelector((state: AppState) => {
    return state.entities.pageList.pages;
  });

  useEffect(() => {
    AnalyticsUtil.logEvent("PAGES_LIST_LOAD", {
      appName: currentApp?.name,
      mode: "EDIT",
    });
  }, []);

  const createPageCallback = useCallback(() => {
    const name = getNextEntityName(
      "Page",
      pages.map((page: Page) => page.pageName),
    );
    // Default layout is extracted by adding dynamically computed properties like min-height.
    const defaultPageLayouts = [
      { dsl: extractCurrentDSL(), layoutOnLoadActions: [] },
    ];
    dispatch(createPage(params.applicationId, name, defaultPageLayouts, true));
  }, [dispatch, pages, params.applicationId]);

  /**
   * updates the order of page
   */
  const setPageOrderCallback = useCallback(
    (pageId: string, newOrder: number) => {
      dispatch(setPageOrder(params.applicationId, pageId, newOrder));
    },
    [dispatch, params.applicationId],
  );

  /**
   * sets the page as default
   */
  const setPageAsDefaultCallback = useCallback(
    (pageId: string, applicationId?: string): void => {
      dispatch(setPageAsDefault(pageId, applicationId));
    },
    [dispatch],
  );

  // closes the pages editor
  const onClose = useCallback(() => {
    history.push(BUILDER_PAGE_URL(params.applicationId, params.pageId));
  }, []);

  return (
    <Wrapper>
      <Header>
        <div>
          <Action type="button">
            <CloseIcon
              color={get(theme, "colors.text.heading")}
              height={20}
              onClick={onClose}
              width={20}
            />
          </Action>
          <h1>Page Properties</h1>
        </div>
        <NewPageButton
          icon="plus"
          onClick={createPageCallback}
          size={Size.medium}
          tag="button"
          text="New Page"
          type="button"
        />
      </Header>

      <DraggableList
        ItemRenderer={({ item }: any) => (
          <PageListItem applicationId={params.applicationId} item={item} />
        )}
        itemHeight={70}
        items={pages}
        onUpdate={(newOrder: any, originalIndex: number, newIndex: number) => {
          if (newIndex === 0) {
            setPageAsDefaultCallback(
              pages[originalIndex].pageId,
              params.applicationId,
            );
          }

          setPageOrderCallback(pages[originalIndex].pageId, newIndex);
        }}
      />
    </Wrapper>
  );
}

export default PagesEditor;
