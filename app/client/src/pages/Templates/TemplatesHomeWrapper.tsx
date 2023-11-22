import React from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  getForkableWorkspaces,
  getTemplatesSelector,
  isFetchingTemplatesSelector,
  isImportingTemplateToAppSelector,
} from "selectors/templatesSelectors";
import styled from "styled-components";
import AnalyticsUtil from "utils/AnalyticsUtil";
import FiltersRevamp from "./FiltersRevamp";
import { TemplatesContentRevamp } from "./TemplatesContentRevamp";
import {
  getApplicationByIdFromWorkspaces,
  getIsFetchingApplications,
} from "@appsmith/selectors/applicationSelectors";
import { importTemplateIntoApplicationViaOnboardingFlow } from "actions/templateActions";
import type { Template } from "api/TemplatesApi";

const FiltersWrapper = styled.div`
  width: ${(props) => props.theme.homePage.sidebar}px;
  height: 100%;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  .filter-wrapper {
    height: 100%;
  }
`;

const TemplateContentWrapper = styled.div`
  flex-grow: 1;
  overflow: auto;
`;

interface TemplatesHomeWrapperProps {
  currentApplicationIdForCreateNewApp: string;
  setSelectedTemplate: (id: string) => void;
}

const TemplatesHomeWrapper = ({
  currentApplicationIdForCreateNewApp,
  setSelectedTemplate,
}: TemplatesHomeWrapperProps) => {
  const dispatch = useDispatch();
  const workspaceList = useSelector(getForkableWorkspaces);
  const allTemplates = useSelector(getTemplatesSelector);
  const isImportingTemplate = useSelector(isImportingTemplateToAppSelector);
  const isFetchingApplications = useSelector(getIsFetchingApplications);
  const isFetchingTemplates = useSelector(isFetchingTemplatesSelector);
  const isLoading = isFetchingApplications || isFetchingTemplates;
  const application = useSelector((state) =>
    getApplicationByIdFromWorkspaces(
      state,
      currentApplicationIdForCreateNewApp,
    ),
  );

  const onForkTemplateClick = (template: Template) => {
    const title = template.title;
    AnalyticsUtil.logEvent("FORK_TEMPLATE_WHEN_ONBOARDING", { title });
    // When fork template is clicked to add a new app using the template
    if (!isImportingTemplate && application) {
      dispatch(
        importTemplateIntoApplicationViaOnboardingFlow(
          template.id,
          template.title,
          template.pages.map((p) => p.name),
          application.id,
          application.workspaceId,
        ),
      );
    }
  };

  const getTemplateById = (id: string) => {
    const template = allTemplates.find((template) => template.id === id);
    return template;
  };

  const onTemplateClick = (id: string) => {
    const template = getTemplateById(id);
    if (template) {
      AnalyticsUtil.logEvent("CLICK_ON_TEMPLATE_CARD_WHEN_ONBOARDING", {
        id,
        title: template.title,
      });
      // When template is clicked to view the template details
      if (!isImportingTemplate) setSelectedTemplate(id);
    }
  };

  return (
    <>
      <TemplateContentWrapper>
        <TemplatesContentRevamp
          isForkingEnabled={!!workspaceList.length}
          onForkTemplateClick={onForkTemplateClick}
          onTemplateClick={onTemplateClick}
        />
      </TemplateContentWrapper>

      {!isLoading && (
        <FiltersWrapper>
          <FiltersRevamp />
        </FiltersWrapper>
      )}
    </>
  );
};

export default TemplatesHomeWrapper;
