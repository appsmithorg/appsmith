import React from "react";
import styled from "styled-components";
import Masonry from "react-masonry-css";
import Template from "./Template";

const Wrapper = styled.div`
  padding-top: 24px;
  height: calc(100vh - ${(props) => props.theme.homePage.search.height}px);
  overflow: auto;
  padding-right: 20px;
  padding-left: 20px;

  .grid {
    display: flex;
    margin-left: -20px;
    margin-top: 32px;
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

export const templates = [
  {
    id: 1,
    description:
      "An admin panel for reading from and writing to your customer data, built on PostgreSQL. This app lets you look through, edit, and add users, orders, and products. An admin panel for reading from and writing to your customer data, built on PostgreSQL.",
  },
  {
    id: 2,
    description:
      "An admin panel for reading from and writing to your customer data, built on PostgreSQL. This app lets you look through, edit, and add users, orders, and products. An admin panel for reading from and writing to your customer data, built on PostgreSQL. An admin panel for reading from and writing to your customer data, built on PostgreSQL. This app lets you look through, edit, and add users, orders, and products. An admin panel for reading from and writing to your customer data, built on PostgreSQL.",
  },
  {
    id: 3,
    description:
      "An admin panel for reading from and writing to your customer data, built on PostgreSQL. This app lets you look through, edit, and add users, orders, and products. An admin panel for reading from and writing to your customer data, built on PostgreSQL.",
  },
  {
    id: 4,
    description:
      "An admin panel for reading from and writing to your customer data, built on PostgreSQL. This app lets you look through, edit, and add users, orders, and products. An admin panel for reading from and writing to your customer data, built on PostgreSQL. An admin panel for reading from and writing to your customer data, built on PostgreSQL. This app lets you look through, edit, and add users, orders, and products. An admin panel for reading from and writing to your customer data, built on PostgreSQL.",
  },
  {
    id: 5,
    description:
      "An admin panel for reading from and writing to your customer data, built on PostgreSQL. This app lets you look through, edit, and add users, orders, and products. An admin panel for reading from and writing to your customer data, built on PostgreSQL. An admin panel for reading from and writing to your customer data, built on PostgreSQL. This app lets you look through, edit, and add users, orders, and products. An admin panel for reading from and writing to your customer data, built on PostgreSQL.",
  },
  {
    id: 6,
    description:
      "An admin panel for reading from and writing to your customer data, built on PostgreSQL. This app lets you look through, edit, and add users, orders, and products. An admin panel for reading from and writing to your customer data, built on PostgreSQL.",
  },
  {
    id: 7,
    description:
      "ough, edit, and add users, orders, and products. An admin panel for reading from and writing to your customer data, built on PostgreSQL. An admin panel for reading from and writing to your customer data, built on PostgreSQL. This app lets you look through, edit, and add users, orders, and products. An admin panel for reading from and writing to your customer data, built on PostgreSQL.",
  },
];

function TemplateList() {
  return (
    <Wrapper>
      <FirstRow>
        {templates.slice(0, 2).map((template) => (
          <Template key={template.id} size="large" template={template} />
        ))}
      </FirstRow>
      <Masonry
        breakpointCols={3}
        className="grid"
        columnClassName="grid_column"
      >
        {templates.slice(2).map((template) => (
          <Template key={template.id} template={template} />
        ))}
      </Masonry>
    </Wrapper>
  );
}

export default TemplateList;
