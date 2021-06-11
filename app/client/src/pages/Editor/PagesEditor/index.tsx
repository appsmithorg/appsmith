import { get, sortBy } from "lodash";
import styled, { useTheme } from "styled-components";
import { useDispatch, useSelector } from "react-redux";
import React, { useEffect, useCallback, useMemo } from "react";
import { useParams, useLocation, useHistory } from "react-router";

import { AppState } from "reducers";
import Header from "./Header";
import Wrapper from "./Wrapper";
import AnalyticsUtil from "utils/AnalyticsUtil";
import PageListItem from "./PageListItem";
import Button, { Size } from "components/ads/Button";
import { Page } from "constants/ReduxActionConstants";
import { getNextEntityName } from "utils/AppsmithUtils";
import DraggableList from "components/ads/DraggableList";
import { extractCurrentDSL } from "utils/WidgetPropsUtils";
import { ExplorerURLParams } from "pages/Editor/Explorer/helpers";
import { getCurrentApplication } from "selectors/applicationSelectors";
import { createPage } from "actions/pageActions";
import { ControlIcons } from "icons/ControlIcons";
import { Action } from "./PageListItem";

const CloseIcon = ControlIcons.CLOSE_CONTROL;

function PagesEditor() {
  const theme = useTheme();
  const location = useLocation();
  const dispatch = useDispatch();
  const history = useHistory();
  const params = useParams<ExplorerURLParams>();
  const currentApp = useSelector(getCurrentApplication);
  const pages = useSelector((state: AppState) => {
    return state.entities.pageList.pages;
  });

  const sortedPages = useMemo(() => {
    return sortBy(pages, (page) => !page.isDefault);
  }, [pages]);

  // log page load
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

  // closes the pages editor
  const onClose = useCallback(() => {
    history.push(location.pathname);
  }, []);

  // if there is no edit-pages in url, don't render the pages editor
  if (location.hash.includes("#edit-pages") === false) return null;

  return (
    <Wrapper>
      <Header>
        <div>
          <Action>
            <CloseIcon
              color={get(theme, "colors.text.heading")}
              height={20}
              onClick={onClose}
              width={20}
            />
          </Action>
          <h1>Page Properties</h1>
        </div>
        <Button
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
        items={sortedPages}
        onUpdate={() => {
          // call update api
        }}
      />
    </Wrapper>
  );
}

export default PagesEditor;
