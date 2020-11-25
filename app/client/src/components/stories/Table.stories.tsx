import React from "react";
import Table from "components/ads/Table";
import Button, { Category, Size } from "components/ads/Button";
import Icon, { IconSize } from "components/ads/Icon";
import TableDropdown from "components/ads/TableDropdown";
import { Position } from "@blueprintjs/core/lib/esm/common/position";
import { StoryWrapper, Variant } from "components/ads/common";

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

const options = [
  {
    name: "Admin",
    desc: "Can edit, view and invite other user to an app",
  },
  {
    name: "Developer",
    desc: "Can view and invite other user to an app",
  },
  {
    name: "User",
    desc: "Can view and invite other user to an app and...",
  },
];

const data = [
  {
    col1: "Dustin Howard",
    col2: "dustin_01@jlegue.com",
    col3: (
      <TableDropdown
        position={Position.BOTTOM}
        options={options}
        onSelect={selectedValue => console.log(selectedValue)}
        selectedIndex={0}
      ></TableDropdown>
    ),
    col4: "App Access",
    col5: (
      <Button
        category={Category.primary}
        variant={Variant.info}
        size={Size.small}
        text={"approve"}
      />
    ),
    col6: <Icon name="delete" size={IconSize.LARGE} />,
  },
  {
    col1: "Austin Howard",
    col2: "dustin_02@jlegue.com",
    col3: (
      <TableDropdown
        position={Position.BOTTOM}
        options={options}
        onSelect={selectedValue => console.log(selectedValue)}
        selectedIndex={1}
      ></TableDropdown>
    ),
    col4: "Map Access",
    col5: (
      <Button
        category={Category.primary}
        variant={Variant.success}
        size={Size.small}
        text={"accepted"}
      />
    ),
    col6: <Icon name="delete" size={IconSize.LARGE} />,
  },
  {
    col1: "Justing Howard",
    col2: "dustin_03@jlegue.com",
    col3: (
      <TableDropdown
        position={Position.BOTTOM}
        options={options}
        onSelect={selectedValue => console.log(selectedValue)}
        selectedIndex={2}
      ></TableDropdown>
    ),
    col4: "Dm Access",
    col5: (
      <Button
        category={Category.primary}
        variant={Variant.warning}
        size={Size.small}
        text={"on hold"}
      />
    ),
    col6: <Icon name="delete" size={IconSize.LARGE} />,
  },
];

export const TableStory = () => (
  <StoryWrapper>
    <Table columns={columns} data={data}></Table>
  </StoryWrapper>
);
