import React from "react";
import Table from "components/ads/Table";
import Button, { Category, Variant, Size } from "components/ads/Button";
import Icon from "components/ads/Icon";
import { StoryWrapper } from "./Tabs.stories";

export default {
  title: "Table",
  component: Table,
};

const columns = [
  {
    Header: "NAME",
    accessor: "col1", // accessor is the "key" in the data
  },
  {
    Header: "EMAIL ID",
    accessor: "col2",
  },
  {
    Header: "ROLE",
    accessor: "col3",
  },
  {
    Header: "ACCESS LEVEL",
    accessor: "col4",
  },
  {
    Header: "STATUS",
    accessor: "col5",
  },
  {
    Header: "DELETE",
    accessor: "col6",
  },
];

const data = [
  {
    col1: "Dustin Howard",
    col2: "dustin_01@jlegue.com",
    col3: "Developer",
    col4: "App Access",
    col5: (
      <Button
        category={Category.primary}
        variant={Variant.info}
        size={Size.small}
        text={"approve"}
      />
    ),
    col6: <Icon name={"delete"} size={Size.large} />,
  },
  {
    col1: "Austin Howard",
    col2: "dustin_02@jlegue.com",
    col3: "User",
    col4: "Map Access",
    col5: (
      <Button
        category={Category.primary}
        variant={Variant.success}
        size={Size.small}
        text={"accepted"}
      />
    ),
    col6: <Icon name={"delete"} size={Size.large} />,
  },
  {
    col1: "Justing Howard",
    col2: "dustin_03@jlegue.com",
    col3: "Admin",
    col4: "Dm Access",
    col5: (
      <Button
        category={Category.primary}
        variant={Variant.warning}
        size={Size.small}
        text={"on hold"}
      />
    ),
    col6: <Icon name={"delete"} size={Size.large} />,
  },
];

export const TableStory = () => (
  <StoryWrapper>
    <Table columns={columns} data={data}></Table>
  </StoryWrapper>
);
