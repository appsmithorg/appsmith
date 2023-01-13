import {
  createMessage,
  SIMILAR_TEMPLATES,
  VIEW_ALL_TEMPLATES,
} from "@appsmith/constants/messages";
import { Template as TemplateInterface } from "api/TemplatesApi";
import { FontWeight, TextType, Text, Icon, IconSize } from "design-system";
import React from "react";
import Masonry, { MasonryProps } from "react-masonry-css";
import styled from "styled-components";
import Template from ".";
import { Section } from "./TemplateDescription";

export const SimilarTemplatesWrapper = styled.div`
  padding-right: 132px;
  padding-left: 132px;

  .grid {
    display: flex;
    margin-left: ${(props) => -props.theme.spaces[9]}px;
    margin-top: ${(props) => props.theme.spaces[12]}px;
  }

  .grid_column {
    padding-left: ${(props) => props.theme.spaces[9]}px;
  }
`;

export const SimilarTemplatesTitleWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const BackButtonWrapper = styled.div<{ width?: number }>`
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: ${(props) => props.theme.spaces[2]}px;
  ${(props) => props.width && `width: ${props.width};`}
`;

type SimilarTemplatesProp = {
  similarTemplates: TemplateInterface[];
  onBackPress: () => void;
  breakpointCols: MasonryProps["breakpointCols"];
  onClick: (template: TemplateInterface) => void;
  onFork?: (template: TemplateInterface) => void;
  className?: string;
};

function SimilarTemplates(props: SimilarTemplatesProp) {
  if (!props.similarTemplates.length) {
    return null;
  }

  return (
    <SimilarTemplatesWrapper className={props.className}>
      <Section>
        <SimilarTemplatesTitleWrapper>
          <Text type={TextType.H1} weight={FontWeight.BOLD}>
            {createMessage(SIMILAR_TEMPLATES)}
          </Text>
          <BackButtonWrapper onClick={props.onBackPress}>
            <Text type={TextType.P4}>{createMessage(VIEW_ALL_TEMPLATES)}</Text>
            <Icon name="view-all" size={IconSize.XL} />
          </BackButtonWrapper>
        </SimilarTemplatesTitleWrapper>
        <Masonry
          breakpointCols={props.breakpointCols}
          className="grid"
          columnClassName="grid_column"
        >
          {props.similarTemplates.map((template) => (
            <Template
              key={template.id}
              onClick={() => props.onClick(template)}
              onForkTemplateClick={props.onFork}
              template={template}
            />
          ))}
        </Masonry>
      </Section>
    </SimilarTemplatesWrapper>
  );
}

export default SimilarTemplates;
