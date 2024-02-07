import {
  START_WITH_TEMPLATE_CONNECT_HEADING,
  START_WITH_TEMPLATE_CONNECT_SUBHEADING,
  createMessage,
} from "@appsmith/constants/messages";
import type { Template } from "api/TemplatesApi";
import { Flex, Text } from "design-system";
import StartWithTemplates from "pages/Templates/StartWithTemplates";
import React from "react";
import { useSelector } from "react-redux";
import { getForkableWorkspaces } from "selectors/templatesSelectors";
import styled from "styled-components";

interface Props {
  setSelectedTemplate: (id: string) => void;
  onForkTemplateClick: (template: Template) => void;
}

const StartWithTemplatesWrapper = ({
  onForkTemplateClick,
  setSelectedTemplate,
}: Props) => {
  const workspaceList = useSelector(getForkableWorkspaces);

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
