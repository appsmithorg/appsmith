import React from "react";
import styled from "styled-components";
import Masonry from "react-masonry-css";
import Template from "./Template";
import { Template as TemplateInterface } from "api/TemplatesApi";

const Wrapper = styled.div`
  padding-right: 33px;
  padding-left: 33px;

  .grid {
    display: flex;
    margin-left: -20px;
  }

  .grid_column {
    padding-left: 20px;
  }
`;

const FirstRow = styled.div`
  display: flex;
  flex-direction: row;
  gap: 19px;
  align-items: flex-start;
`;
interface TemplateListProps {
  templates: TemplateInterface[];
}

function TemplateList(props: TemplateListProps) {
  return (
    <Wrapper>
      <FirstRow>
        {props.templates.slice(0, 2).map((template) => (
          <Template
            key={template.id}
            openInNewTab
            size="large"
            template={template}
          />
        ))}
      </FirstRow>
      <Masonry
        breakpointCols={3}
        className="grid"
        columnClassName="grid_column"
      >
        {props.templates.slice(2).map((template) => (
          <Template key={template.id} openInNewTab template={template} />
        ))}
      </Masonry>
    </Wrapper>
  );
}

export default TemplateList;
