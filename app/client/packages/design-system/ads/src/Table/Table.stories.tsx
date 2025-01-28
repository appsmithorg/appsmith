import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Table } from "./Table";
import { Tooltip } from "../Tooltip";
import type { ColumnType } from "rc-table/lib/interface";

export default {
  title: "ADS/Components/Table",
  component: Table,
  decorators: [
    (Story) => (
      <div
        style={{
          width: "60%",
          height: "50vh",
          display: "table",
        }}
      >
        <Story />
      </div>
    ),
  ],
} as Meta<typeof Table>;

type Story = StoryObj<typeof Table>;

export const TableStory: Story = {
  name: "Table",
  argTypes: {
    columns: {
      control: {
        type: "object",
      },
      description: "Table columns",
    },
    data: {
      control: {
        type: "object",
      },
      description: "Table data",
    },
    sticky: {
      control: {
        type: "boolean",
      },
      description:
        "This flag makes the table header sticky. This can be an object also.",
      table: {
        defaultValue: {
          summary: "boolean | TableSticky",
        },
        type: {
          summary: `TableSticky {
            offsetHeader?: number;
            offsetSummary?: number;
            offsetScroll?: number;
            getContainer?: () => Window | HTMLElement;
        }`,
        },
      },
    },
    className: {
      control: {
        type: "text",
      },
      description: "Table className",
    },
    id: {
      control: {
        type: "text",
      },
      description: "Table id",
    },
    expandable: {
      control: {
        type: "object",
      },
      description:
        "Table expandable. ExpandableConfig object from rc-table. https://www.npmjs.com/package/rc-table",
    },
    rowKey: {
      control: {
        type: "text",
      },
      description:
        "If rowKey is string, record[rowKey] will be used as key. If rowKey is function, the return value of rowKey(record, index) will be use as key.",
    },
    rowClassName: {
      control: {
        type: "text",
      },
      description: "get row's className",
      table: {
        type: {
          summary: "string or Function(record, index, indent):string",
        },
      },
    },
    onRow: {
      control: {
        type: "object",
      },
      description: "onRow handler",
      table: {
        type: {
          summary: "Function(record, index):Object",
        },
      },
    },
    onHeaderRow: {
      control: {
        type: "object",
      },
      description: "onHeaderRow handler",
      table: {
        type: {
          summary: "Function(columns):Object",
        },
      },
    },
    emptyText: {
      control: {
        type: "text",
      },
      description: "empty text to show",
      table: {
        type: {
          summary: "string | ReactNode | Function",
        },
        defaultValue: {
          summary: "No Data",
        },
      },
    },
    summary: {
      control: {
        type: "object",
      },
      description:
        "Summary attribute in table component is used to define the summary row.",
      table: {
        type: {
          summary: "Function(data):ReactNode",
        },
      },
    },
  },
  args: {
    columns: [
      {
        title: "Column 1",
        dataIndex: "col1",
        width: 110,
      },
      {
        title: "Column 2",
        dataIndex: "col2",
        width: 110,
      },
      {
        title: "Column 3",
        dataIndex: "col3",
        width: 110,
      },
      {
        title: "Column 4",
        dataIndex: "col4",
        width: 110,
      },
      {
        title: "Column 5",
        dataIndex: "col5",
        width: 110,
      },
      {
        title: "Column 6",
        dataIndex: "col6",
        width: 110,
        ellipsis: {
          showTitle: false,
        },
        render: (value: string) => (
          <Tooltip content={value} placement="topLeft">
            <span>{value}</span>
          </Tooltip>
        ),
      },
      {
        title: "Column 7",
        dataIndex: "col7",
        width: 110,
      },
    ],
    data: [
      {
        col1: "Row 1, Column 1",
        col2: "Row 1, Column 2",
        col3: "Row 1, Column 3",
        col4: "Row 1, Column 4",
        col5: "Row 1, Column 5",
        col6: "Row 1, Column 6",
        col7: "Row 1, Column 7",
        col8: "Row 1, Column 8",
        col9: "Row 1, Column 9",
        col10: "Row 1, Column 10",
      },
      {
        col1: "Row 2, Column 1",
        col2: "Row 2, Column 2",
        col3: "Row 2, Column 3",
        col4: "Row 2, Column 4",
        col5: "Row 2, Column 5",
        col6: "Row 2, Column 6",
        col7: "Row 2, Column 7",
        col8: "Row 2, Column 8",
        col9: "Row 2, Column 9",
        col10: "Row 2, Column 10",
      },
      {
        col1: "Row 3, Column 1",
        col2: "Row 3, Column 2",
        col3: "Row 3, Column 3",
        col4: "Row 3, Column 4",
        col5: "Row 3, Column 5",
        col6: "Row 3, Column 6",
        col7: "Row 3, Column 7",
        col8: "Row 3, Column 8",
        col9: "Row 3, Column 9",
        col10: "Row 3, Column 10",
      },
      {
        col1: "Row 4, Column 1",
        col2: "Row 4, Column 2",
        col3: "Row 4, Column 3",
        col4: "Row 4, Column 4",
        col5: "Row 4, Column 5",
        col6: "Row 4, Column 6",
        col7: "Row 4, Column 7",
        col8: "Row 4, Column 8",
        col9: "Row 4, Column 9",
        col10: "Row 4, Column 10",
      },
      {
        col1: "Row 5, Column 1",
        col2: "Row 5, Column 2",
        col3: "Row 5, Column 3",
        col4: "Row 5, Column 4",
        col5: "Row 5, Column 5",
        col6: "Row 5, Column 6",
        col7: "Row 5, Column 7",
        col8: "Row 5, Column 8",
        col9: "Row 5, Column 9",
        col10: "Row 5, Column 10",
      },
      {
        col1: "Row 6, Column 1",
        col2: "Row 6, Column 2",
        col3: "Row 6, Column 3",
        col4: "Row 6, Column 4",
        col5: "Row 6, Column 5",
        col6: "Row 6, Column 6",
        col7: "Row 6, Column 7",
        col8: "Row 6, Column 8",
        col9: "Row 6, Column 9",
        col10: "Row 6, Column 10",
      },
      {
        col1: "Row 7, Column 1",
        col2: "Row 7, Column 2",
        col3: "Row 7, Column 3",
        col4: "Row 7, Column 4",
        col5: "Row 7, Column 5",
        col6: "Row 7, Column 6",
        col7: "Row 7, Column 7",
        col8: "Row 7, Column 8",
        col9: "Row 7, Column 9",
        col10: "Row 7, Column 10",
      },
      {
        col1: "Row 8, Column 1",
        col2: "Row 8, Column 2",
        col3: "Row 8, Column 3",
        col4: "Row 8, Column 4",
        col5: "Row 8, Column 5",
        col6: "Row 8, Column 6",
        col7: "Row 8, Column 7",
        col8: "Row 8, Column 8",
        col9: "Row 8, Column 9",
        col10: "Row 8, Column 10",
      },
      {
        col1: "Row 9, Column 1",
        col2: "Row 9, Column 2",
        col3: "Row 9, Column 3",
        col4: "Row 9, Column 4",
        col5: "Row 9, Column 5",
        col6: "Row 9, Column 6",
        col7: "Row 9, Column 7",
        col8: "Row 9, Column 8",
        col9: "Row 9, Column 9",
        col10: "Row 9, Column 10",
      },
      {
        col1: "Row 10, Column 1",
        col2: "Row 10, Column 2",
        col3: "Row 10, Column 3",
        col4: "Row 10, Column 4",
        col5: "Row 10, Column 5",
        col6: "Row 10, Column 6",
        col7: "Row 10, Column 7",
        col8: "Row 10, Column 8",
        col9: "Row 10, Column 9",
        col10: "Row 10, Column 10",
      },
    ],
    sticky: true,
    tableLayout: "fixed",
  },
  render: (args) => <Table {...args} />,
};

interface RecordType {
  [key: string]: unknown;
}

type ColumnStory = StoryObj<ColumnType<RecordType>>;
export const TableColumnStory: ColumnStory = {
  name: "Table Column",
  argTypes: {
    key: {
      control: {
        type: "text",
      },
      description: "Key for the column",
    },
    className: {
      control: {
        type: "text",
      },
      description: "className for the column",
    },
    colSpan: {
      control: {
        type: "number",
      },
      description: "Number of columns to be spanned",
    },
    title: {
      control: {
        type: "text",
      },
      description: "Title of the column",
    },
    dataIndex: {
      control: {
        type: "text",
      },
      description: "Display field of the data record",
    },
    width: {
      control: {
        type: "number",
      },
      description: "Width of the column",
    },
    fixed: {
      control: {
        type: "text",
      },
      description: "Set column to be fixed: true(same as left) 'left' 'right'",
    },
    align: {
      control: {
        type: "text",
      },
      description: "Alignment of the column",
    },
    ellipsis: {
      control: {
        type: "boolean",
      },
      description: "Whether ellipsis show or not",
      table: {
        defaultValue: {
          summary: "false",
        },
      },
    },
    rowScope: {
      control: {
        type: "text",
      },
      description: "Scope of the row",
      table: {
        type: {
          summary: "row | rowgroup",
        },
      },
    },
    onCell: {
      control: {
        type: "object",
      },
      description: "onCell handler",
      table: {
        type: {
          summary: "Function(record, index):Object",
        },
      },
    },
    onHeaderCell: {
      control: {
        type: "object",
      },
      description: "onHeaderCell handler",
      table: {
        type: {
          summary: "Function(column):Object",
        },
      },
    },
    render: {
      control: {
        type: "object",
      },
      description: "Render function of the cell",
      table: {
        type: {
          summary: "Function(value, record, index):ReactNode",
        },
      },
    },
  },
};

/**
 * Sorting in the table can be enabled by passing the `isSortable` prop. For primitive data types, sorting will work automatically.
 * To enable sorting for objects, the `sortBy` prop must also be passed in columns data. The value of the `sortBy` property will be used as the key for sorting.
 */
export const SortableTable: Story = {
  args: {
    ...TableStory.args,
    isSortable: true,
  },
};
