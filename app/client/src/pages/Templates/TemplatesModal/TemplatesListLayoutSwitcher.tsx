import type { Template as TemplateInterface } from "api/TemplatesApi";
import { CANVAS_STARTER_TEMPLATES_SEE_MORE_BUILDING_BLOCKS_PRE_FILTER } from "constants/TemplatesConstants";
import { Flex } from "design-system";
import React, { useMemo } from "react";
import styled from "styled-components";
import StartWithTemplates from "../StartWithTemplates";

interface Props {
  isStartWithTemplateFlow?: boolean;
  onTemplateClick: (id: string) => void;
}

const TemplatesListLayoutSwitcher = ({
  isStartWithTemplateFlow,
  onTemplateClick,
}: Props) => {
  const onForkTemplateClick = (template: TemplateInterface) => {
    onTemplateClick(template.id);
  };
  const initFilters = useMemo(
    () =>
      isStartWithTemplateFlow
        ? CANVAS_STARTER_TEMPLATES_SEE_MORE_BUILDING_BLOCKS_PRE_FILTER
        : undefined,
    [isStartWithTemplateFlow],
  );
  return (
    <Flex flexDirection="column" pl="spaces-3" pr="spaces-3">
      <TemplateWrapper>
        <StartWithTemplates
          initialFilters={initFilters}
          isModalLayout
          onForkTemplateClick={onForkTemplateClick}
          setSelectedTemplate={onTemplateClick}
        />
      </TemplateWrapper>
    </Flex>
  );
};

export default TemplatesListLayoutSwitcher;

const TemplateWrapper = styled.div`
  display: flex;
  flex-grow: 1;
  overflow: hidden;
  height: 100%;
`;
