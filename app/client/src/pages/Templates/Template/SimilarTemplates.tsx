import {
  createMessage,
  SIMILAR_TEMPLATES,
  VIEW_ALL_TEMPLATES,
} from "ee/constants/messages";
import type { Template as TemplateInterface } from "api/TemplatesApi";
import { Text, Link } from "@appsmith/ads";
import React, { useCallback } from "react";
import styled from "styled-components";
import { Section } from "./TemplateDescription";
import FixedHeightTemplate from "./FixedHeightTemplate";
import BuildingBlock from "../BuildingBlock";
import { TEMPLATE_BUILDING_BLOCKS_FILTER_FUNCTION_VALUE } from "../constants";

const SimilarTemplatesWrapper = styled.div`
  padding-right: 132px;
  padding-left: 132px;
`;

const SimilarTemplatesTitleWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const TemplateGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  grid-gap: 16px;
  margin-top: ${(props) => props.theme.spaces[12]}px;
`;

interface SimilarTemplatesProp {
  similarTemplates: TemplateInterface[];
  onBackPress: (e: React.MouseEvent) => void;
  onClick: (template: TemplateInterface) => void;
  onFork?: (template: TemplateInterface) => void;
  className?: string;
  isForkingEnabled: boolean;
}

function SimilarTemplates(props: SimilarTemplatesProp) {
  const handleClick = useCallback(
    (template: TemplateInterface) => {
      props.onClick(template);
    },
    [props.onClick],
  );

  if (!props.similarTemplates.length) {
    return null;
  }

  return (
    <SimilarTemplatesWrapper className={props.className}>
      <Section>
        <SimilarTemplatesTitleWrapper>
          <Text kind="heading-m" renderAs="h4">
            {createMessage(SIMILAR_TEMPLATES)}
          </Text>
          <Link endIcon="view-all" onClick={props.onBackPress}>
            {createMessage(VIEW_ALL_TEMPLATES)}
          </Link>
        </SimilarTemplatesTitleWrapper>
        <TemplateGrid>
          {props.similarTemplates.map((template) => {
            if (
              template.functions.includes(
                TEMPLATE_BUILDING_BLOCKS_FILTER_FUNCTION_VALUE,
              )
            ) {
              return (
                <BuildingBlock
                  buildingBlock={template}
                  hideForkTemplateButton={props.isForkingEnabled}
                  key={template.id}
                  onClick={() => handleClick(template)}
                  onForkTemplateClick={props.onFork}
                />
              );
            }

            return (
              <FixedHeightTemplate
                hideForkTemplateButton={props.isForkingEnabled}
                key={template.id}
                onClick={() => handleClick(template)}
                onForkTemplateClick={props.onFork}
                template={template}
              />
            );
          })}
        </TemplateGrid>
      </Section>
    </SimilarTemplatesWrapper>
  );
}

export default SimilarTemplates;
