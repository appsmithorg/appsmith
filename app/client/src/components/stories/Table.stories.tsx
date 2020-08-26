import React from "react";
import Table from "components/ads/Table";
import Button, { Category, Variant, Size } from "components/ads/Button";
import Icon, { IconName } from "components/ads/Icon";
import TableDropdown from "components/ads/TableDropdown";
import { Position } from "@blueprintjs/core/lib/esm/common/position";
import { action } from "@storybook/addon-actions";
import { boolean, withKnobs } from "@storybook/addon-knobs";
import { withDesign } from "storybook-addon-designs";

export default {
  title: "TableAds",
  component: Table,
  decorators: [withKnobs, withDesign],
};

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

/* eslint-disable react/display-name */
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
    Cell: (props: { cell: { value: string } }) => {
      const roleArr = options;
      const selectedIndex = options.findIndex(
        el => el.name === props.cell.value,
      );

      return (
        <TableDropdown
          position={Position.BOTTOM}
          options={roleArr}
          onSelect={selectedValue =>
            console.log("selectedValue", selectedValue)
          }
          selectedIndex={selectedIndex}
        ></TableDropdown>
      );
    },
  },
  {
    Header: "ACCESS LEVEL",
    accessor: "col4",
  },
  {
    Header: "STATUS",
    accessor: "col5",
    Cell: (props: { cell: { value: string } }) => (
      <Button
        category={Category.primary}
        variant={Variant.success}
        size={Size.small}
        text={props.cell.value}
        onClick={action("button-clicked")}
      />
    ),
  },
  {
    Header: "DELETE",
    accessor: "col6",
    Cell: (props: { cell: { value: IconName } }) => (
      <Icon
        name={props.cell.value}
        size={Size.large}
        onClick={action("delete-clicked")}
      />
    ),
  },
];

const data = [
  {
    col1: "Dustin Howard",
    col2: "dustin_01@jlegue.com",
    col3: "Admin",
    col4: "App Access",
    col5: "approve",
    col6: "delete",
  },
  {
    col1: "Austin Howard",
    col2: "dustin_02@jlegue.com",
    col3: "User",
    col4: "Map Access",
    col5: "accepted",
    col6: "delete",
  },
  {
    col1: "Justing Howard",
    col2: "dustin_03@jlegue.com",
    col3: "Developer",
    col4: "Dm Access",
    col5: "On hold",
    col6: "delete",
  },
];

export const TableStory = () => {
  return (
    <div style={{ background: "#131216", padding: "50px" }}>
      <Table
        isLoading={boolean("isLoading", false)}
        columns={columns}
        data={data}
      ></Table>
    </div>
  );
};
