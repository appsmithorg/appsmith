import React from "react";
import Table from "../ads/Table";
import Button, { Category, Variant, Size } from "../ads/Button";
import { Icon } from "../ads/Icon";

export default {
  title: "Table",
  component: Table,
};

const columns = [
  {
    width: 1000,
    Header: "NAME",
    accessor: "col1", // accessor is the "key" in the data
    disableSortBy: true,
  },
  {
    Header: "EMAIL ID",
    accessor: "col2",
    disableSortBy: true,
  },
  {
    Header: "ROLE",
    accessor: "col3",
    disableSortBy: false,
    width: 50,
  },
  {
    Header: "ACCESS LEVEL",
    accessor: "col4",
    disableSortBy: true,
  },
  {
    Header: "STATUS",
    accessor: "col5",
    disableSortBy: false,
  },
  {
    Header: "DELETE",
    accessor: "col6",
    disableSortBy: true,
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

export const withDynamicProps = () => (
  <div style={{ background: "#131216", padding: "50px" }}>
    <Table columns={columns} data={data}></Table>
  </div>
);
