import React, { useEffect } from "react";
import styled from "styled-components";
import * as Sentry from "@sentry/react";
import { ControlGroup, Classes } from "@blueprintjs/core";
import { debounce, noop } from "lodash";
import { Switch, Route, useRouteMatch } from "react-router-dom";
import SearchInput, { SearchVariant } from "components/ads/SearchInput";
import TemplateList from "./TemplateList";
import TemplateView from "./TemplateView";
import { useDispatch, useSelector } from "react-redux";
import { setHeaderMeta } from "actions/themeActions";
import {
  getAllTemplates,
  setTemplateSearchQuery,
} from "actions/templateActions";
import {
  getOrganizationForTemplates,
  getSearchedTemplateList,
  getTemplateSearchQuery,
  isFetchingTemplatesSelector,
} from "selectors/templatesSelectors";
import { fetchPlugins } from "actions/pluginActions";
import { getIsFetchingApplications } from "selectors/applicationSelectors";
import { editorInitializer } from "utils/EditorUtils";
import { AppState } from "reducers";
const SentryRoute = Sentry.withSentryRouting(Route);

const TemplateListWrapper = styled.div`
  padding-top: 26px;
  width: calc(100% - ${(props) => props.theme.homePage.sidebar}px);
  height: calc(100vh - ${(props) => props.theme.headerHeight});
  overflow: auto;
`;

const ResultsCount = styled.div`
  font-size: 18px;
  font-weight: 500;
  color: #090707;
  margin-top: 26px;
  margin-left: 32px;
  padding-bottom: 24px;
`;

const Loader = styled(TemplateListWrapper)`
  height: 100vh;
  .results-count {
    height: 20px;
    width: 100px;
  }
`;

const LoadingTemplateList = styled.div`
  margin-top: 24px;
  height: calc(100% - 200px);
  margin-right: 20px;
  margin-left: 32px;
`;

const SearchWrapper = styled.div`
  margin-left: 25px;
`;

function TemplateRoutes() {
  const { path } = useRouteMatch();
  const dispatch = useDispatch();
  const templateOrganization = useSelector(getOrganizationForTemplates);
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
    if (templateOrganization?.organization.id) {
      dispatch(fetchPlugins(templateOrganization?.organization.id));
    }
  }, [templateOrganization?.organization.id]);

  return (
    <Switch>
      <SentryRoute component={TemplateView} path={`${path}/:templateId`} />
      <SentryRoute component={Templates} path={path} />
    </Switch>
  );
}

function Templates() {
  const templates = useSelector(getSearchedTemplateList);
  const isFetchingApplications = useSelector(getIsFetchingApplications);
  const isFetchingTemplates = useSelector(isFetchingTemplatesSelector);
  const templateSearchQuery = useSelector(getTemplateSearchQuery);
  const dispatch = useDispatch();
  const resultsText =
    templates.length > 1
      ? `Showing all ${templates.length} templates`
      : templates.length === 1
      ? "Showing 1 template"
      : "No templates to show";
  const isLoading = isFetchingApplications || isFetchingTemplates;

  const onChange = (query: string) => {
    dispatch(setTemplateSearchQuery(query));
  };
  const debouncedOnChange = debounce(onChange, 250, { maxWait: 1000 });

  if (isLoading) {
    return (
      <Loader>
        <ResultsCount className={`results-count ${Classes.SKELETON}`} />
        <LoadingTemplateList className={Classes.SKELETON} />
      </Loader>
    );
  }

  return (
    <TemplateListWrapper>
      <SearchWrapper>
        <ControlGroup>
          <SearchInput
            cypressSelector={"t--application-search-input"}
            defaultValue={templateSearchQuery}
            disabled={isLoading}
            onChange={debouncedOnChange || noop}
            placeholder={"Search templates"}
            variant={SearchVariant.BACKGROUND}
          />
        </ControlGroup>
      </SearchWrapper>
      <ResultsCount>{resultsText}</ResultsCount>
      <TemplateList templates={templates} />
    </TemplateListWrapper>
  );
}

export default TemplateRoutes;
