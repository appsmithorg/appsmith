import React from "react";
import styled from "styled-components";
import Masonry from "react-masonry-css";
import Template from "./Template";
import type { Template as TemplateInterface } from "api/TemplatesApi";
import RequestTemplate from "./Template/RequestTemplate";

const breakpointColumnsObject = {
  default: 4,
  3000: 3,
  1500: 2,
  950: 1,
};

const Wrapper = styled.div`
  padding: 0 11px;
  // padding-right: ${(props) => props.theme.spaces[12]}px;
  // padding-left: ${(props) => props.theme.spaces[12]}px;

  .grid {
    display: flex;
    // margin-left: ${(props) => -props.theme.spaces[9]}px;
  }

  .grid_column {
    padding: 11px;
    // padding-left: ${(props) => props.theme.spaces[9]}px;
  }
`;

interface TemplateListProps {
  isForkingEnabled: boolean;
  templates: TemplateInterface[];
  onTemplateClick?: (id: string) => void;
  onForkTemplateClick?: (template: TemplateInterface) => void;
}

function TemplateList(props: TemplateListProps) {
  return (
    <Wrapper>
      <Masonry
        breakpointCols={breakpointColumnsObject}
        className="grid"
        columnClassName="grid_column"
      >
        {props.templates.map((template) => (
          <Template
            isForkingEnabled={props.isForkingEnabled}
            key={template.id}
            onClick={props.onTemplateClick}
            onForkTemplateClick={props.onForkTemplateClick}
            size="large"
            template={template}
          />
        ))}
        <RequestTemplate />
      </Masonry>
    </Wrapper>
  );
}

export default TemplateList;
