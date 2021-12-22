import { get } from "lodash";
import styled, { useTheme } from "styled-components";
import { useParams, useHistory } from "react-router";
import React, { useEffect, useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";

import AnalyticsUtil from "utils/AnalyticsUtil";
import { ControlIcons } from "icons/ControlIcons";
import { IconWrapper } from "components/ads/Icon";
import { BUILDER_PAGE_URL } from "constants/routes";
import Button, { Size } from "components/ads/Button";
import PageListItem, { Action } from "./PageListItem";
import { Page } from "constants/ReduxActionConstants";
import {
  getCurrentApplicationId,
  getPageList,
} from "selectors/editorSelectors";
import { getNextEntityName } from "utils/AppsmithUtils";
import DraggableList from "components/ads/DraggableList";
import { extractCurrentDSL } from "utils/WidgetPropsUtils";
import { createPage, setPageOrder } from "actions/pageActions";
import { ExplorerURLParams } from "pages/Editor/Explorer/helpers";
import { getCurrentApplication } from "selectors/applicationSelectors";

const Wrapper = styled.div`
  padding: 20px;
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
  const pages = useSelector(getPageList);
  const params = useParams<ExplorerURLParams>();
  const currentApp = useSelector(getCurrentApplication);
  const applicationId = useSelector(getCurrentApplicationId) as string;

  useEffect(() => {
    AnalyticsUtil.logEvent("PAGES_LIST_LOAD", {
      appName: currentApp?.name,
      mode: "EDIT",
    });
  }, []);

  /**
   * creates the page
   *
   * @return void
   */
  const createPageCallback = useCallback(() => {
    const name = getNextEntityName(
      "Page",
      pages.map((page: Page) => page.pageName),
    );
    // Default layout is extracted by adding dynamically computed properties like min-height.
    const defaultPageLayouts = [
      { dsl: extractCurrentDSL(), layoutOnLoadActions: [] },
    ];
    dispatch(createPage(applicationId, name, defaultPageLayouts, true));
  }, [dispatch, pages, applicationId]);

  /**
   * updates the order of page
   *
   * @return void
   */
  const setPageOrderCallback = useCallback(
    (pageId: string, newOrder: number) => {
      dispatch(setPageOrder(applicationId, pageId, newOrder));
    },
    [dispatch, applicationId],
  );

  /**
   * closes the page properties onc lick
   *
   * @return void
   */
  const onClose = useCallback(() => {
    history.push(BUILDER_PAGE_URL({ applicationId, pageId: params.pageId }));
  }, []);

  /**
   * Draggable List Render item
   *
   *
   * @return JSX.Element
   */
  const draggableListRenderItem = useMemo(
    () =>
      function renderer({ item }: any) {
        return <PageListItem item={item} />;
      },
    [],
  );

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
        ItemRenderer={draggableListRenderItem}
        itemHeight={70}
        items={pages}
        onUpdate={(newOrder: any, originalIndex: number, newIndex: number) => {
          setPageOrderCallback(pages[originalIndex].pageId, newIndex);
        }}
        shouldReRender={false}
      />
    </Wrapper>
  );
}

export default PagesEditor;
