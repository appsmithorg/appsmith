import React from "react";
import styled from "styled-components";
import Filters from "./Filters";
import { TemplatesContent } from ".";
import { useSelector } from "react-redux";
import { getForkableWorkspaces } from "selectors/templatesSelectors";

const FiltersWrapper = styled.div`
  width: ${(props) => props.theme.homePage.sidebar}px;
  height: 100%;
  display: flex;
  flex-direction: column;
  border-right: 1px solid var(--ads-v2-color-border);
  flex-shrink: 0;
  .filter-wrapper {
    height: 100%;
  }
`;

const TemplateContentWrapper = styled.div`
  flex-grow: 1;
  overflow: auto;
`;

const TemplatesMainRevamp = () => {
  const workspaceList = useSelector(getForkableWorkspaces);

  // const onForkTemplateClick = (template: Template) => {
  //   const title = template.title;
  //   AnalyticsUtil.logEvent("FORK_TEMPLATE_WHEN_ONBOARDING", { title });
  //   // When fork template is clicked to add a new app using the template
  //   if (!isImportingTemplate && application) {
  //     dispatch(
  //       importTemplateIntoApplicationViaOnboardingFlow(
  //         template.id,
  //         template.title,
  //         template.pages.map((p) => p.name),
  //         application.id,
  //         application.workspaceId,
  //       ),
  //     );
  //   }
  // };

  // const onTemplateClick = (id: string) => {
  //   const template = getTemplateById(id);
  //   if (template) {
  //     AnalyticsUtil.logEvent("CLICK_ON_TEMPLATE_CARD_WHEN_ONBOARDING", {
  //       id,
  //       title: template.title,
  //     });
  //     // When template is clicked to view the template details
  //     if (!isImportingTemplate) setSelectedTemplate(id);
  //   }
  // };

  return (
    <>
      <FiltersWrapper>
        <Filters />
      </FiltersWrapper>
      <TemplateContentWrapper>
        <TemplatesContent
          isForkingEnabled={!!workspaceList.length}
          onForkTemplateClick={() => true}
          onTemplateClick={() => true}
        />
      </TemplateContentWrapper>
    </>
  );
};

export default TemplatesMainRevamp;
