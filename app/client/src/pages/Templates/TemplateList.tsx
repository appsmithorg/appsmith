import React from "react";
import styled from "styled-components";
import Masonry from "react-masonry-css";
import Template from "./Template";
import { Template as TemplateInterface } from "api/TemplatesApi";
import RequestTemplate from "./Template/RequestTemplate";

const Wrapper = styled.div`
  padding-right: ${(props) => props.theme.spaces[12]}px;
  padding-left: ${(props) => props.theme.spaces[12]}px;

  .grid {
    display: flex;
    margin-left: ${(props) => -props.theme.spaces[9]}px;
  }

  .grid_column {
    padding-left: ${(props) => props.theme.spaces[9]}px;
  }
`;

const FirstRow = styled.div`
  display: flex;
  flex-direction: row;
  gap: ${(props) => props.theme.spaces[8]}px;
`;
interface TemplateListProps {
  templates: TemplateInterface[];
}

function TemplateList(props: TemplateListProps) {
  return (
    <Wrapper>
      <FirstRow>
        {props.templates.slice(0, 2).map((template) => (
          <Template key={template.id} size="large" template={template} />
        ))}
      </FirstRow>
      <Masonry
        breakpointCols={3}
        className="grid"
        columnClassName="grid_column"
      >
        {props.templates.slice(2).map((template) => (
          <Template key={template.id} template={template} />
        ))}
        <RequestTemplate />
      </Masonry>
    </Wrapper>
  );
}

export default TemplateList;
