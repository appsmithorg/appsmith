import React, { useEffect } from "react";
import styled from "styled-components";
import * as Sentry from "@sentry/react";
import { Classes, ControlGroup } from "@blueprintjs/core";
import { debounce, noop } from "lodash";
import { Switch, Route, useRouteMatch } from "react-router-dom";
import SearchInput, { SearchVariant } from "components/ads/SearchInput";
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
import { editorInitializer } from "utils/EditorUtils";
import { AppState } from "reducers";
import {
  getIsFetchingApplications,
  getUserApplicationsOrgsList,
} from "selectors/applicationSelectors";
import { getAllApplications } from "actions/applicationActions";
import { getTypographyByKey } from "constants/DefaultTheme";
import { Colors } from "constants/Colors";
import { createMessage, SEARCH_TEMPLATES } from "@appsmith/constants/messages";
import LeftPaneBottomSection from "pages/Home/LeftPaneBottomSection";
const SentryRoute = Sentry.withSentryRouting(Route);

const PageWrapper = styled.div`
  margin-top: ${(props) => props.theme.homePage.header}px;
  display: flex;
  height: calc(100vh - ${(props) => props.theme.homePage.header}px);
  padding-left: 8vw;
`;

const SidebarWrapper = styled.div`
  width: ${(props) => props.theme.homePage.sidebar}px;
  height: 100%;
  display: flex;
  padding-left: ${(props) => props.theme.spaces[7]}px;
  padding-top: ${(props) => props.theme.spaces[11]}px;
  flex-direction: column;
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
  const organizationListLength = useSelector(
    (state: AppState) => getUserApplicationsOrgsList(state).length,
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
    if (!organizationListLength) {
      dispatch(getAllApplications());
    }
  }, [organizationListLength]);

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

type TemplatesContentProps = {
  onTemplateClick: () => void;
  onForkTemplateClick?: (id: string) => void;
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
    return <TemplateListLoader />;
  }

  return (
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
      <TemplateList
        onForkTemplateClick={props.onForkTemplateClick}
        onTemplateClick={props.onTemplateClick}
        templates={templates}
      />
    </>
  );
}

function Templates() {
  return (
    <PageWrapper>
      <SidebarWrapper>
        <SecondaryWrapper>
          <Filters />
          <LeftPaneBottomSection />
        </SecondaryWrapper>
      </SidebarWrapper>
      <TemplateListWrapper>
        <TemplatesContent onTemplateClick={() => null} />
      </TemplateListWrapper>
    </PageWrapper>
  );
}

export default TemplateRoutes;
