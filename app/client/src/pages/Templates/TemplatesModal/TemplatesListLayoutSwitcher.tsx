import type { Template as TemplateInterface } from "api/TemplatesApi";
import { CANVAS_STARTER_TEMPLATES_SEE_MORE_BUILDING_BLOCKS_PRE_FILTER } from "constants/TemplatesConstants";
import { Flex } from "design-system";
import React from "react";
import styled from "styled-components";
import StartWithTemplates from "../StartWithTemplates";
import TemplatesList from "./TemplateList";

interface Props {
  isStartWithTemplateFlow?: boolean;
  onTemplateClick: (id: string) => void;
  onClose: (isOpen: boolean) => void;
}

const TemplatesListLayoutSwitcher = ({
  isStartWithTemplateFlow,
  onClose,
  onTemplateClick,
}: Props) => {
  const onForkTemplateClick = (template: TemplateInterface) => {
    onTemplateClick(template.id);
  };
  return isStartWithTemplateFlow ? (
    <Flex flexDirection="column" pl="spaces-3" pr="spaces-3">
      <TemplateWrapper>
        <StartWithTemplates
          initialFilters={
            CANVAS_STARTER_TEMPLATES_SEE_MORE_BUILDING_BLOCKS_PRE_FILTER
          }
          isModalLayout
          onForkTemplateClick={onForkTemplateClick}
          setSelectedTemplate={onTemplateClick}
        />
      </TemplateWrapper>
    </Flex>
  ) : (
    <TemplatesList
      onClose={() => onClose(false)}
      onTemplateClick={onTemplateClick}
    />
  );
};

export default TemplatesListLayoutSwitcher;

const TemplateWrapper = styled.div`
  display: flex;
  flex-grow: 1;
  overflow: hidden;
  height: 100%;
`;
