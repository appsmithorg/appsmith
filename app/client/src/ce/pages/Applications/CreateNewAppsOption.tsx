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
import { Colors } from "constants/Colors";
import StartScratch from "assets/images/start-from-scratch.svg";
import StartTemplate from "assets/images/start-from-template.svg";

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
  background: ${Colors.WHITE};
  padding: var(--ads-v2-spaces-3) 0;
  z-index: 1;
`;

const FiltersWrapper = styled.div`
  width: ${(props) => props.theme.homePage.sidebar}px;
  height: 100%;
  display: flex;
  padding: 16px 16px 0;
  flex-direction: column;
  border-right: 1px solid var(--ads-v2-color-border);
  flex-shrink: 0;
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
  border: 1px solid #cdd5df;
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

export const CreateNewAppsOption = ({
  currentSelectedWorkspace,
  onClickBack,
  startFromScratch,
}: {
  currentSelectedWorkspace: string;
  onClickBack: () => void;
  startFromScratch: () => void;
}) => {
  const [useTemplate, setUseTemplate] = useState(false);
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
    if (!isImportingTemplate) onForkTemplateClick({ id } as Template);
  };

  const onForkTemplateClick = (template: Template) => {
    if (!isImportingTemplate)
      dispatch(
        importTemplateToWorkspace(template.id, currentSelectedWorkspace),
      );
  };

  return (
    <SectionWrapper>
      <BackWrapper>
        <Link
          className="t--create-new-app-option-goback"
          data-testid="t--create-new-app-option-goback"
          onClick={useTemplate ? goBackFromTemplate : onClickBack}
          startIcon="arrow-left-line"
        >
          {createMessage(GO_BACK)}
        </Link>
      </BackWrapper>
      {useTemplate ? (
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
