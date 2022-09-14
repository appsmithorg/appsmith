import React, { useEffect } from "react";
import styled from "styled-components";
import * as Sentry from "@sentry/react";
import { Classes, ControlGroup } from "@blueprintjs/core";
import { debounce, noop } from "lodash";
import { Switch, Route, useRouteMatch } from "react-router-dom";
import { SearchInput, SearchVariant } from "design-system";
import TemplateList from "./TemplateList";
import TemplateView from "./TemplateView";
import Filters from "pages/Templates/Filters";
import { useDispatch, useSelector } from "react-redux";
import { setHeaderMeta } from "actions/themeActions";
import {
  getAllTemplates,
  setTemplateSearchQuery,
} from "actions/templateActions";
import {
  getSearchedTemplateList,
  getTemplateFiltersLength,
  getTemplateSearchQuery,
  isFetchingTemplatesSelector,
} from "selectors/templatesSelectors";
import { fetchDefaultPlugins } from "actions/pluginActions";
import { AppState } from "@appsmith/reducers";
import { editorInitializer } from "utils/editor/EditorUtils";
import {
  getIsFetchingApplications,
  getUserApplicationsWorkspacesList,
} from "selectors/applicationSelectors";
import { getAllApplications } from "actions/applicationActions";
import { getTypographyByKey } from "constants/DefaultTheme";
import { Colors } from "constants/Colors";
import { createMessage, SEARCH_TEMPLATES } from "@appsmith/constants/messages";
import ReconnectDatasourceModal from "pages/Editor/gitSync/ReconnectDatasourceModal";
const SentryRoute = Sentry.withSentryRouting(Route);

const PageWrapper = styled.div`
  margin-top: ${(props) => props.theme.homePage.header}px;
  display: flex;
  height: calc(100vh - ${(props) => props.theme.homePage.header}px);
  padding-left: 8vw;
`;

export const TemplateListWrapper = styled.div`
  padding-top: ${(props) => props.theme.spaces[11]}px;
  width: calc(100% - ${(props) => props.theme.homePage.sidebar}px);
  height: calc(100vh - ${(props) => props.theme.headerHeight});
  overflow: auto;
  padding-right: 8vw;
`;

export const ResultsCount = styled.div`
  ${(props) => getTypographyByKey(props, "h1")}
  color: ${Colors.CODE_GRAY};
  margin-top: ${(props) => props.theme.spaces[5]}px;
  margin-left: ${(props) => props.theme.spaces[12]}px;
  padding-bottom: ${(props) => props.theme.spaces[11]}px;
`;

const Loader = styled(TemplateListWrapper)`
  height: 100vh;
  .results-count {
    height: 20px;
    width: 100px;
  }
`;

const LoadingTemplateList = styled.div`
  margin-top: ${(props) => props.theme.spaces[11]}px;
  // 200 is to have some space at the bottom
  height: calc(100% - 200px);
  margin-right: ${(props) => props.theme.spaces[9]}px;
  margin-left: ${(props) => props.theme.spaces[12] + 2}px;
`;

const SearchWrapper = styled.div`
  margin-left: ${(props) => props.theme.spaces[11]}px;
`;

function TemplateRoutes() {
  const { path } = useRouteMatch();
  const dispatch = useDispatch();
  const workspaceListLength = useSelector(
    (state: AppState) => getUserApplicationsWorkspacesList(state).length,
  );
  const pluginListLength = useSelector(
    (state: AppState) => state.entities.plugins.defaultPluginList.length,
  );
  const templatesCount = useSelector(
    (state: AppState) => state.ui.templates.templates.length,
  );

  useEffect(() => {
    dispatch(setHeaderMeta(true, true));
    // Generate the widget config list
    editorInitializer();
  }, []);

  useEffect(() => {
    if (!templatesCount) {
      dispatch(getAllTemplates());
    }
  }, [templatesCount]);

  useEffect(() => {
    if (!workspaceListLength) {
      dispatch(getAllApplications());
    }
  }, [workspaceListLength]);

  useEffect(() => {
    if (!pluginListLength) {
      dispatch(fetchDefaultPlugins());
    }
  }, [pluginListLength]);

  return (
    <Switch>
      <SentryRoute component={TemplateView} path={`${path}/:templateId`} />
      <SentryRoute component={Templates} path={path} />
    </Switch>
  );
}

function TemplateListLoader() {
  return (
    <Loader>
      <ResultsCount className={`results-count ${Classes.SKELETON}`} />
      <LoadingTemplateList className={Classes.SKELETON} />
    </Loader>
  );
}

function Templates() {
  const templates = useSelector(getSearchedTemplateList);
  const templateSearchQuery = useSelector(getTemplateSearchQuery);
  const isFetchingApplications = useSelector(getIsFetchingApplications);
  const isFetchingTemplates = useSelector(isFetchingTemplatesSelector);
  const filterCount = useSelector(getTemplateFiltersLength);
  const dispatch = useDispatch();
  let resultsText =
    templates.length > 1
      ? `Showing all ${templates.length} templates`
      : templates.length === 1
      ? "Showing 1 template"
      : "No templates to show";

  if (templates.length) {
    resultsText +=
      filterCount > 1
        ? ` matching ${filterCount} filters`
        : filterCount === 1
        ? " matching 1 filter"
        : "";
  }

  const isLoading = isFetchingApplications || isFetchingTemplates;

  const onChange = (query: string) => {
    dispatch(setTemplateSearchQuery(query));
  };
  const debouncedOnChange = debounce(onChange, 250, { maxWait: 1000 });

  return (
    <PageWrapper>
      <ReconnectDatasourceModal />
      <Filters />
      <TemplateListWrapper>
        {isLoading ? (
          <TemplateListLoader />
        ) : (
          <>
            <SearchWrapper>
              <ControlGroup>
                <SearchInput
                  cypressSelector={"t--application-search-input"}
                  defaultValue={templateSearchQuery}
                  disabled={isLoading}
                  onChange={debouncedOnChange || noop}
                  placeholder={createMessage(SEARCH_TEMPLATES)}
                  variant={SearchVariant.BACKGROUND}
                />
              </ControlGroup>
            </SearchWrapper>
            <ResultsCount>{resultsText}</ResultsCount>
            <TemplateList templates={templates} />
          </>
        )}
      </TemplateListWrapper>
    </PageWrapper>
  );
}

export default TemplateRoutes;
