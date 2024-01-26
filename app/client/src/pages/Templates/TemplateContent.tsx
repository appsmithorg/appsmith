import { setTemplateSearchQuery } from "actions/templateActions";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import { SEARCH_TEMPLATES } from "@appsmith/constants/messages";
import { getIsFetchingApplications } from "@appsmith/selectors/selectedWorkspaceSelectors";
import { SearchInput } from "design-system";
import { createMessage } from "design-system-old/build/constants/messages";
import { debounce } from "lodash";
import React, { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  getTemplateSearchQuery,
  isFetchingTemplatesSelector,
  getSearchedTemplateList,
  getTemplateFiltersLength,
} from "selectors/templatesSelectors";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { ResultsCount } from ".";
import { SearchWrapper } from "./StartWithTemplateFilter/StyledComponents";
import type { Template } from "api/TemplatesApi";
import TemplateList from "./TemplateList";
import LoadingScreen from "./TemplatesModal/LoadingScreen";

interface TemplatesContentProps {
  onTemplateClick?: (id: string) => void;
  onForkTemplateClick?: (template: Template) => void;
  stickySearchBar?: boolean;
  isForkingEnabled: boolean;
  filterWithAllowPageImport?: boolean;
}
const INPUT_DEBOUNCE_TIMER = 500;
function TemplatesContent(props: TemplatesContentProps) {
  const templateSearchQuery = useSelector(getTemplateSearchQuery);
  const isFetchingApplications = useSelector(getIsFetchingApplications);
  const isFetchingTemplates = useSelector(isFetchingTemplatesSelector);
  const isLoading = isFetchingApplications || isFetchingTemplates;
  const dispatch = useDispatch();
  const onChange = debounce((query: string) => {
    dispatch(setTemplateSearchQuery(query));
    AnalyticsUtil.logEvent("TEMPLATES_SEARCH_INPUT_EVENT", { query });
  }, INPUT_DEBOUNCE_TIMER);
  const filterWithAllowPageImport = props.filterWithAllowPageImport || false;
  const templates = useSelector(getSearchedTemplateList).filter((template) =>
    filterWithAllowPageImport ? !!template.allowPageImport : true,
  );
  const filterCount = useSelector(getTemplateFiltersLength);

  useEffect(() => {
    dispatch({
      type: ReduxActionTypes.RESET_TEMPLATE_FILTERS,
    });
  }, []);
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
        <div className="templates-search">
          <SearchInput
            data-testid={"t--application-search-input"}
            isDisabled={isLoading}
            onChange={onChange}
            placeholder={createMessage(SEARCH_TEMPLATES)}
            value={templateSearchQuery}
          />
        </div>
      </SearchWrapper>
      <ResultsCount
        data-testid="t--application-templates-results-header"
        kind="heading-m"
        renderAs="h1"
      >
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

export default TemplatesContent;
