import {
  getTemplateFilters,
  importTemplateToWorkspace,
} from "actions/templateActions";
import type { Template } from "api/TemplatesApi";
import type { AppState } from "@appsmith/reducers";
import { TemplatesContent } from "pages/Templates";
import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  allTemplatesFiltersSelector,
  getForkableWorkspaces,
  isImportingTemplateSelector,
} from "selectors/templatesSelectors";
import styled from "styled-components";
import { getAllTemplates } from "actions/templateActions";
import { Link, Text } from "design-system";
import {
  CREATE_NEW_APPS_STEP_SUBTITLE,
  CREATE_NEW_APPS_STEP_TITLE,
  GO_BACK,
  START_FROM_SCRATCH_SUBTITLE,
  START_FROM_SCRATCH_TITLE,
  START_FROM_TEMPLATE_SUBTITLE,
  START_FROM_TEMPLATE_TITLE,
  createMessage,
} from "@appsmith/constants/messages";
import Filters from "pages/Templates/Filters";
import { isEmpty } from "lodash";
import StartScratch from "assets/images/start-from-scratch.svg";
import StartTemplate from "assets/images/start-from-template.svg";
import { TemplateView } from "pages/Templates/TemplateView";

const SectionWrapper = styled.div`
  display: flex;
  flex-direction: column;
  padding: 0 var(--ads-v2-spaces-7) var(--ads-v2-spaces-7);
  ${(props) => `
    height: calc(100vh - ${props.theme.homePage.header}px);
    margin-top: ${props.theme.homePage.header}px;
  `}
`;

const BackWrapper = styled.div`
  position: sticky;
  background: ;
  ${(props) => `
    top: ${props.theme.homePage.header}px;
    `}
  background: var(--ads-v2-color-bg);
  padding: var(--ads-v2-spaces-3);
  z-index: 1;
`;

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

const TemplateWrapper = styled.div`
  display: flex;
  flex-grow: 1;
  overflow: hidden;
`;

const TemplateContentWrapper = styled.div`
  flex-grow: 1;
  overflow: auto;
`;

const OptionWrapper = styled.div`
  display: flex;
  align-items: center;
  flex-direction: column;
  justify-content: center;
  flex-grow: 1;
`;

const CardsWrapper = styled.div`
  display: flex;
  gap: 16px;
  margin-top: 48px;
`;

const CardContainer = styled.div`
  display: flex;
  flex-direction: column;
  padding: 48px;
  border: 1px solid var(--ads-v2-color-border);
  width: 324px;
  align-items: center;
  text-align: center;
  cursor: pointer;
  img {
    height: 160px;
    margin-bottom: 48px;
  }
`;

type CardProps = {
  src: string;
  subTitle: string;
  title: string;
  onClick?: () => void;
};

const Card = ({ onClick, src, subTitle, title }: CardProps) => {
  return (
    <CardContainer onClick={onClick}>
      <img alt={title} src={src} />
      <Text kind="heading-s">{title}</Text>
      <Text>{subTitle}</Text>
    </CardContainer>
  );
};

const CreateNewAppsOption = ({
  currentSelectedWorkspace,
  onClickBack,
  startFromScratch,
}: {
  currentSelectedWorkspace: string;
  onClickBack: () => void;
  startFromScratch: () => void;
}) => {
  const [useTemplate, setUseTemplate] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const templatesCount = useSelector(
    (state: AppState) => state.ui.templates.templates.length,
  );
  const filters = useSelector(allTemplatesFiltersSelector);
  const workspaceList = useSelector(getForkableWorkspaces);
  const isImportingTemplate = useSelector(isImportingTemplateSelector);
  const dispatch = useDispatch();
  const onClickStartFromTemplate = () => {
    if (isEmpty(filters.functions)) {
      dispatch(getTemplateFilters());
    }

    if (!templatesCount) {
      dispatch(getAllTemplates());
    }
    setUseTemplate(true);
  };

  const goBackFromTemplate = () => {
    setUseTemplate(false);
  };

  const onTemplateClick = (id: string) => {
    // When template is clicked to view the template details
    if (!isImportingTemplate) setSelectedTemplate(id);
  };

  const onClickUseTemplate = (id: string) => {
    // When Use template is clicked on template view detail screen
    if (!isImportingTemplate)
      dispatch(importTemplateToWorkspace(id, currentSelectedWorkspace));
  };

  const onForkTemplateClick = (template: Template) => {
    // When fork template is clicked to add a new app using the template
    if (!isImportingTemplate)
      dispatch(
        importTemplateToWorkspace(template.id, currentSelectedWorkspace),
      );
  };

  const onClickBackButton = () => {
    if (useTemplate) {
      if (selectedTemplate) {
        // Going back from template details view screen
        setSelectedTemplate("");
      } else {
        // Going back from start from template screen
        goBackFromTemplate();
      }
    } else {
      // Going back from create new app flow
      onClickBack();
    }
  };

  return (
    <SectionWrapper>
      <BackWrapper>
        <Link
          className="t--create-new-app-option-goback"
          data-testid="t--create-new-app-option-goback"
          onClick={onClickBackButton}
          startIcon="arrow-left-line"
        >
          {createMessage(GO_BACK)}
        </Link>
      </BackWrapper>
      {useTemplate ? (
        selectedTemplate ? (
          <TemplateView
            onClickUseTemplate={onClickUseTemplate}
            showBack={false}
            showSimilarTemplate={false}
            templateId={selectedTemplate}
          />
        ) : (
          <TemplateWrapper>
            <FiltersWrapper>
              <Filters />
            </FiltersWrapper>
            <TemplateContentWrapper>
              <TemplatesContent
                isForkingEnabled={!!workspaceList.length}
                onForkTemplateClick={onForkTemplateClick}
                onTemplateClick={onTemplateClick}
              />
            </TemplateContentWrapper>
          </TemplateWrapper>
        )
      ) : (
        <OptionWrapper>
          <Text kind="heading-xl">
            {createMessage(CREATE_NEW_APPS_STEP_TITLE)}
          </Text>
          <Text>{createMessage(CREATE_NEW_APPS_STEP_SUBTITLE)}</Text>
          <CardsWrapper>
            <Card
              onClick={onClickStartFromTemplate}
              src={StartTemplate}
              subTitle={createMessage(START_FROM_TEMPLATE_TITLE)}
              title={createMessage(START_FROM_TEMPLATE_SUBTITLE)}
            />
            <Card
              onClick={startFromScratch}
              src={StartScratch}
              subTitle={createMessage(START_FROM_SCRATCH_SUBTITLE)}
              title={createMessage(START_FROM_SCRATCH_TITLE)}
            />
          </CardsWrapper>
        </OptionWrapper>
      )}
    </SectionWrapper>
  );
};

export default CreateNewAppsOption;
