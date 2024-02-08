import {
  START_WITH_TEMPLATE_CONNECT_HEADING,
  START_WITH_TEMPLATE_CONNECT_SUBHEADING,
  createMessage,
} from "@appsmith/constants/messages";
import { getApplicationByIdFromWorkspaces } from "@appsmith/selectors/applicationSelectors";
import {
  importTemplateIntoApplicationViaOnboardingFlow,
  setActiveLoadingTemplateId,
} from "actions/templateActions";
import type { Template } from "api/TemplatesApi";
import { Flex, Text } from "design-system";
import StartWithTemplates from "pages/Templates/StartWithTemplates";
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  getForkableWorkspaces,
  isImportingTemplateToAppSelector,
} from "selectors/templatesSelectors";
import styled from "styled-components";
import AnalyticsUtil from "utils/AnalyticsUtil";

interface Props {
  currentApplicationIdForCreateNewApp: string;
  setSelectedTemplate: (id: string) => void;
}

const StartWithTemplatesWrapper = ({
  currentApplicationIdForCreateNewApp,
  setSelectedTemplate,
}: Props) => {
  const dispatch = useDispatch();
  const isImportingTemplate = useSelector(isImportingTemplateToAppSelector);
  const workspaceList = useSelector(getForkableWorkspaces);

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
      dispatch(setActiveLoadingTemplateId(template.id));
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
  return (
    <Flex flexDirection="column" pl="spaces-3" pr="spaces-3">
      <Header
        subtitle={createMessage(START_WITH_TEMPLATE_CONNECT_SUBHEADING)}
        title={createMessage(START_WITH_TEMPLATE_CONNECT_HEADING)}
      />
      <TemplateWrapper>
        <StartWithTemplates
          isForkingEnabled={!!workspaceList.length}
          onForkTemplateClick={onForkTemplateClick}
          setSelectedTemplate={setSelectedTemplate}
        />
      </TemplateWrapper>
    </Flex>
  );
};

export default StartWithTemplatesWrapper;

const TemplateWrapper = styled.div`
  display: flex;
  flex-grow: 1;
  overflow: hidden;
`;

const Header = ({ subtitle, title }: { subtitle: string; title: string }) => {
  return (
    <Flex flexDirection="column" mb="spaces-14" mt="spaces-7">
      <Text kind="heading-xl">{title}</Text>
      <Text>{subtitle}</Text>
    </Flex>
  );
};
