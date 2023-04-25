import React, { useEffect } from "react";
import styled from "styled-components";
import * as Sentry from "@sentry/react";
import { debounce, noop, isEmpty } from "lodash";
import { Switch, Route, useRouteMatch } from "react-router-dom";
import { SearchInput, Text } from "design-system";
import TemplateList from "./TemplateList";
import TemplateView from "./TemplateView";
import Filters from "pages/Templates/Filters";
import { useDispatch, useSelector } from "react-redux";
import { setHeaderMeta } from "actions/themeActions";
import {
  getAllTemplates,
  getTemplateFilters,
  setTemplateSearchQuery,
} from "actions/templateActions";
import {
  getForkableWorkspaces,
  getSearchedTemplateList,
  getTemplateFiltersLength,
  getTemplateSearchQuery,
  isFetchingTemplatesSelector,
} from "selectors/templatesSelectors";
import { fetchDefaultPlugins } from "actions/pluginActions";
import type { AppState } from "@appsmith/reducers";
import { editorInitializer } from "utils/editor/EditorUtils";
import {
  getIsFetchingApplications,
  getUserApplicationsWorkspacesList,
} from "@appsmith/selectors/applicationSelectors";
import { getAllApplications } from "@appsmith/actions/applicationActions";
import { createMessage, SEARCH_TEMPLATES } from "@appsmith/constants/messages";
import LeftPaneBottomSection from "@appsmith/pages/Home/LeftPaneBottomSection";
import type { Template } from "api/TemplatesApi";
import LoadingScreen from "./TemplatesModal/LoadingScreen";
import ReconnectDatasourceModal from "pages/Editor/gitSync/ReconnectDatasourceModal";
const SentryRoute = Sentry.withSentryRouting(Route);

const PageWrapper = styled.div`
  margin-top: ${(props) => props.theme.homePage.header}px;
  display: flex;
  height: calc(100vh - ${(props) => props.theme.homePage.header}px);
`;

const SidebarWrapper = styled.div`
  width: ${(props) => props.theme.homePage.sidebar}px;
  height: 100%;
  display: flex;
  padding: 16px 16px 0;
  flex-direction: column;
  border-right: 1px solid var(--ads-v2-color-border);
  position: fixed;
`;

const SecondaryWrapper = styled.div`
  height: calc(
    100vh - ${(props) => props.theme.homePage.header + props.theme.spaces[11]}px
  );
  position: relative;
`;

export const TemplateListWrapper = styled.div`
  padding-top: ${(props) => props.theme.spaces[11]}px;
  width: calc(100% - ${(props) => props.theme.homePage.sidebar}px);
  height: calc(100vh - ${(props) => props.theme.headerHeight});
  margin-left: ${(props) => props.theme.homePage.sidebar}px;
`;

export const ResultsCount = styled(Text)`
  color: var(--ads-v2-color-fg-emphasis);
  margin-top: 20px;
  margin-left: ${(props) => props.theme.spaces[12] - 8}px;
  padding-bottom: 20px;
`;

const SearchWrapper = styled.div<{ sticky?: boolean }>`
  margin-left: ${(props) => props.theme.spaces[11]}px;
  max-width: 250px;
  ${(props) =>
    props.sticky &&
    `position: sticky;
  top: 0;
  position: -webkit-sticky;
  z-index: 1;
  background-color: var(--ads-v2-color-bg)`}
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
  const filters = useSelector(
    (state: AppState) => state.ui.templates.allFilters,
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

  useEffect(() => {
    if (isEmpty(filters.functions)) {
      dispatch(getTemplateFilters());
    }
  }, [filters]);

  return (
    <Switch>
      <SentryRoute component={TemplateView} path={`${path}/:templateId`} />
      <SentryRoute component={Templates} path={path} />
    </Switch>
  );
}

type TemplatesContentProps = {
  onTemplateClick?: (id: string) => void;
  onForkTemplateClick?: (template: Template) => void;
  stickySearchBar?: boolean;
  isForkingEnabled: boolean;
};

export function TemplatesContent(props: TemplatesContentProps) {
  const templateSearchQuery = useSelector(getTemplateSearchQuery);
  const isFetchingApplications = useSelector(getIsFetchingApplications);
  const isFetchingTemplates = useSelector(isFetchingTemplatesSelector);
  const isLoading = isFetchingApplications || isFetchingTemplates;
  const dispatch = useDispatch();
  const onChange = (query: string) => {
    dispatch(setTemplateSearchQuery(query));
  };
  const debouncedOnChange = debounce(onChange, 250, { maxWait: 1000 });
  const templates = useSelector(getSearchedTemplateList);
  const filterCount = useSelector(getTemplateFiltersLength);

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

  if (isLoading) {
    return <LoadingScreen text="Loading templates" />;
  }

  return (
    <>
      <SearchWrapper sticky={props.stickySearchBar}>
        <SearchInput
          data-test-id={"t--application-search-input"}
          isDisabled={isLoading}
          onChange={debouncedOnChange || noop}
          placeholder={createMessage(SEARCH_TEMPLATES)}
          value={templateSearchQuery}
        />
      </SearchWrapper>
      <ResultsCount kind="heading-m" renderAs="h1">
        {resultsText}
      </ResultsCount>
      <TemplateList
        isForkingEnabled={props.isForkingEnabled}
        onForkTemplateClick={props.onForkTemplateClick}
        onTemplateClick={props.onTemplateClick}
        templates={templates}
      />
    </>
  );
}

function Templates() {
  const workspaceList = useSelector(getForkableWorkspaces);

  return (
    <PageWrapper>
      <SidebarWrapper>
        <SecondaryWrapper>
          <ReconnectDatasourceModal />
          <Filters />
          <LeftPaneBottomSection />
        </SecondaryWrapper>
      </SidebarWrapper>
      <TemplateListWrapper>
        <TemplatesContent isForkingEnabled={!!workspaceList.length} />
      </TemplateListWrapper>
    </PageWrapper>
  );
}

export default TemplateRoutes;
