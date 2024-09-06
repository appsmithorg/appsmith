import { getIsFetchingApplications } from "ee/selectors/selectedWorkspaceSelectors";
import type { EventName } from "ee/utils/analyticsUtilTypes";
import type { Template as TemplateInterface } from "api/TemplatesApi";
import React from "react";
import { useSelector } from "react-redux";
import {
  getTemplatesSelector,
  isFetchingTemplatesSelector,
  isImportingTemplateToAppSelector,
} from "selectors/templatesSelectors";
import styled from "styled-components";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";
import { TemplateContent } from "./TemplateContent";
import TemplateFilters from "./TemplateFilters";

const FiltersWrapper = styled.div`
  width: ${(props) => props.theme.homePage.sidebar}px;
  height: 100%;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  .filter-wrapper {
    height: 100%;
  }
  padding-left: 12px;
  padding-right: 12px;
`;

const TemplateContentWrapper = styled.div`
  flex-grow: 1;
  overflow: auto;
  height: 75vh;
  padding-bottom: 24px;
`;

interface TemplatesLayoutWithFilterProps {
  initialFilters?: Record<string, string[]>;
  isForkingEnabled?: boolean;
  isModalLayout?: boolean;
  setSelectedTemplate: (id: string) => void;
  onForkTemplateClick: (template: TemplateInterface) => void;
  analyticsEventNameForTemplateCardClick: EventName;
}

const TemplatesLayoutWithFilters = ({
  analyticsEventNameForTemplateCardClick,
  initialFilters,
  isForkingEnabled = false,
  isModalLayout,
  onForkTemplateClick,
  setSelectedTemplate,
}: TemplatesLayoutWithFilterProps) => {
  const allTemplates = useSelector(getTemplatesSelector);
  const isImportingTemplate = useSelector(isImportingTemplateToAppSelector);
  const isFetchingApplications = useSelector(getIsFetchingApplications);
  const isFetchingTemplates = useSelector(isFetchingTemplatesSelector);
  const isLoading = isFetchingApplications || isFetchingTemplates;

  const getTemplateById = (id: string) => {
    return allTemplates.find((template) => template.id === id);
  };

  const onTemplateClick = (id: string) => {
    const template = getTemplateById(id);
    if (template) {
      AnalyticsUtil.logEvent(analyticsEventNameForTemplateCardClick, {
        id,
        title: template.title,
      });
      // When template is clicked to view the template details
      if (!isImportingTemplate && setSelectedTemplate) setSelectedTemplate(id);
    }
  };

  return (
    <>
      <TemplateContentWrapper>
        <TemplateContent
          filterWithAllowPageImport={isModalLayout}
          isForkingEnabled={isForkingEnabled}
          isModalLayout={!!isModalLayout}
          onForkTemplateClick={onForkTemplateClick}
          onTemplateClick={onTemplateClick}
        />
      </TemplateContentWrapper>

      {!isLoading && (
        <FiltersWrapper>
          <TemplateFilters initialFilters={initialFilters} />
        </FiltersWrapper>
      )}
    </>
  );
};

export default TemplatesLayoutWithFilters;
