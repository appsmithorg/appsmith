import {
  START_WITH_TEMPLATE_CONNECT_HEADING,
  START_WITH_TEMPLATE_CONNECT_SUBHEADING,
  createMessage,
} from "ee/constants/messages";
import type { Template } from "api/TemplatesApi";
import { Flex, Text } from "@appsmith/ads";
import TemplatesLayoutWithFilters from "pages/Templates/TemplatesLayoutWithFilters";
import React from "react";
import { useSelector } from "react-redux";
import { getForkableWorkspaces } from "selectors/templatesSelectors";
import styled from "styled-components";

interface Props {
  setSelectedTemplate: (id: string) => void;
  onForkTemplateClick: (template: Template) => void;
  isInsideModal?: boolean;
}

const StartWithTemplatesWrapper = ({
  onForkTemplateClick,
  setSelectedTemplate,
}: Props) => {
  const workspaceList = useSelector(getForkableWorkspaces);

  return (
    <Flex flexDirection="column" pl="spaces-3" pr="spaces-3">
      <StartWithTemplatesHeader
        subtitle={createMessage(START_WITH_TEMPLATE_CONNECT_SUBHEADING)}
        title={createMessage(START_WITH_TEMPLATE_CONNECT_HEADING)}
      />
      <TemplateWrapper>
        <TemplatesLayoutWithFilters
          analyticsEventNameForTemplateCardClick="CLICK_ON_TEMPLATE_CARD_WHEN_ONBOARDING"
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

interface HeaderProps {
  subtitle: string;
  title: string;
  isModalLayout?: boolean;
}

export const StartWithTemplatesHeader = ({
  isModalLayout,
  subtitle,
  title,
}: HeaderProps) => {
  return (
    <Flex
      flexDirection="column"
      mb={isModalLayout ? "spaces-5" : "spaces-14"}
      mt={isModalLayout ? undefined : "spaces-7"}
    >
      <Text kind="heading-xl">{title}</Text>
      <Text>{subtitle}</Text>
    </Flex>
  );
};
