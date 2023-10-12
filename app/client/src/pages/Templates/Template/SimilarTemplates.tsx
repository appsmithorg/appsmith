import {
  createMessage,
  SIMILAR_TEMPLATES,
  VIEW_ALL_TEMPLATES,
} from "@appsmith/constants/messages";
import type { Template as TemplateInterface } from "api/TemplatesApi";
import { Text, Link } from "design-system";
import React from "react";
import type { MasonryProps } from "react-masonry-css";
import Masonry from "react-masonry-css";
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

// const BackButtonWrapper = styled.div<{ width?: number }>`
//   cursor: pointer;
//   display: flex;
//   align-items: center;
//   gap: ${(props) => props.theme.spaces[2]}px;
//   ${(props) => props.width && `width: ${props.width};`}
// `;

interface SimilarTemplatesProp {
  similarTemplates: TemplateInterface[];
  onBackPress: (e: React.MouseEvent) => void;
  breakpointCols: MasonryProps["breakpointCols"];
  onClick: (template: TemplateInterface) => void;
  onFork?: (template: TemplateInterface) => void;
  className?: string;
  isForkingEnabled: boolean;
}

function SimilarTemplates(props: SimilarTemplatesProp) {
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
        <Masonry
          breakpointCols={props.breakpointCols}
          className="grid"
          columnClassName="grid_column"
        >
          {props.similarTemplates.map((template) => (
            <Template
              hideForkTemplateButton={props.isForkingEnabled}
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
