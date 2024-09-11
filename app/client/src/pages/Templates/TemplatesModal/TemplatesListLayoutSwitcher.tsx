import type { EventName } from "ee/utils/analyticsUtilTypes";
import type { Template as TemplateInterface } from "api/TemplatesApi";
import { CANVAS_STARTER_TEMPLATES_SEE_MORE_BUILDING_BLOCKS_PRE_FILTER } from "constants/TemplatesConstants";
import { Flex } from "@appsmith/ads";
import React, { useMemo } from "react";
import styled from "styled-components";
import TemplatesLayoutWithFilters from "../TemplatesLayoutWithFilters";

interface Props {
  analyticsEventNameForTemplateCardClick: EventName;
  isForkingEnabled?: boolean;
  isStartWithTemplateFlow?: boolean;
  onTemplateClick: (id: string) => void;
  onForkTemplateClick?: (templateId: string) => void;
}

const TemplatesListLayoutSwitcher = ({
  analyticsEventNameForTemplateCardClick,
  isForkingEnabled = false,
  isStartWithTemplateFlow,
  onForkTemplateClick,
  onTemplateClick,
}: Props) => {
  const handleForking = (template: TemplateInterface) => {
    onForkTemplateClick
      ? onForkTemplateClick(template.id)
      : onTemplateClick(template.id);
  };
  const initFilters = useMemo(
    () =>
      isStartWithTemplateFlow
        ? CANVAS_STARTER_TEMPLATES_SEE_MORE_BUILDING_BLOCKS_PRE_FILTER
        : undefined,
    [isStartWithTemplateFlow],
  );
  return (
    <Flex flexDirection="column">
      <TemplateWrapper>
        <TemplatesLayoutWithFilters
          analyticsEventNameForTemplateCardClick={
            analyticsEventNameForTemplateCardClick
          }
          initialFilters={initFilters}
          isForkingEnabled={isForkingEnabled}
          isModalLayout
          onForkTemplateClick={handleForking}
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
