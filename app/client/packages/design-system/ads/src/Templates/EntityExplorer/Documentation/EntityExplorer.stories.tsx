import type { Meta, StoryObj } from "@storybook/react";
import React from "react";
import { Flex } from "../../../Flex";
import { ListWithHeader } from "../ListWithHeader";
import { EditorSegments } from "../EditorSegments";
import { SearchAndAdd } from "../SearchAndAdd";
import { EntityGroupsList } from "../EntityGroupsList";
import { EntityListTree } from "../EntityListTree";
import { EntityItem } from "../EntityItem";
import type { EntityListTreeItem } from "../EntityListTree/EntityListTree.types";
import type { EntityGroupProps } from "../EntityGroupsList/EntityGroupsList.types";
import { ExplorerContainer } from "../ExplorerContainer";
import { Icon } from "../../../Icon";
import { Button } from "../../../Button";
import { ListItem } from "../../../List";
import { noop } from "lodash";

const meta: Meta = {
  title: "ADS/Templates/Entity Explorer/Documentation",
  component: Flex,
};

export default meta;
type Story = StoryObj<typeof Flex>;

// Mock data
const mockSegments = {
  options: [
    { label: "Widgets", value: "widgets" },
    { label: "Queries", value: "queries" },
    { label: "JS", value: "js" },
  ],
  selectedSegment: "widgets",
};

const mockGroups: EntityGroupProps<{
  id: string;
  name: string;
  type: string;
}>[] = [
  {
    groupTitle: "Group 1",
    items: [
      { id: "1", name: "Item 1", type: "widget" },
      { id: "2", name: "Item 2", type: "widget" },
    ],
    className: "group-1",
    renderList: (item) => (
      <EntityItem
        id={item.id}
        key={item.id}
        nameEditorConfig={defaultNameEditorConfig}
        onClick={() => {
          // eslint-disable-next-line no-console
          console.log("Group item clicked:", item);
        }}
        startIcon={<Icon name="apps-line" />}
        title={item.name}
      />
    ),
  },
  {
    groupTitle: "Group 2",
    items: [
      { id: "3", name: "Item 3", type: "widget" },
      { id: "4", name: "Item 4", type: "widget" },
    ],
    className: "group-2",
    renderList: (item) => (
      <EntityItem
        id={item.id}
        key={item.id}
        nameEditorConfig={defaultNameEditorConfig}
        onClick={() => {
          // eslint-disable-next-line no-console
          console.log("Group item clicked:", item);
        }}
        startIcon={<Icon name="comment-context-menu" />}
        title={item.name}
      />
    ),
  },
];

const mockTreeItems: EntityListTreeItem[] = [
  {
    id: "container-1",
    name: "Container 1",
    type: "container",
    children: [
      {
        id: "button-1",
        name: "Button 1",
        type: "button",
        isExpanded: false,
        isSelected: false,
      },
      {
        id: "input-1",
        name: "Input 1",
        type: "input",
        isExpanded: true,
        isSelected: true,
      },
    ],
    isExpanded: true,
    isSelected: false,
  },
  {
    id: "container-2",
    name: "Container 2",
    type: "container",
    children: [
      {
        id: "table-1",
        name: "Table 1",
        type: "table",
        isExpanded: false,
        isSelected: false,
      },
      {
        id: "chart-1",
        name: "Chart 1",
        type: "chart",
        isExpanded: false,
        isSelected: false,
      },
    ],
    isExpanded: true,
    isSelected: false,
  },
];

const defaultNameEditorConfig = {
  canEdit: true,
  isEditing: false,
  isLoading: false,
  onEditComplete: () => {},
  onNameSave: () => {},
  validateName: () => null,
};

const TreeItemComponent: React.FC<{ item: EntityListTreeItem }> = ({
  item,
}) => <ListItem onClick={noop} title={item.name} />;

// Story with segments, search and add, and group lists
export const WithSegmentsAndGroups: Story = {
  render: () => (
    <ExplorerContainer borderRight="STANDARD">
      <EditorSegments
        onSegmentChange={(value: string) => {
          // eslint-disable-next-line no-console
          console.log("Segment changed:", value);
        }}
        options={mockSegments.options}
        selectedSegment={mockSegments.selectedSegment}
      />
      <Flex
        backgroundColor="var(--ads-v2-color-bg)"
        flexDirection="column"
        gap="spaces-2"
        height="600px"
        p="spaces-2"
        width="300px"
      >
        <SearchAndAdd
          onAdd={() => {
            // eslint-disable-next-line no-console
            console.log("Add clicked");
          }}
          onSearch={(query: string) => {
            // eslint-disable-next-line no-console
            console.log("Search:", query);
          }}
          placeholder="Search widgets..."
          showAddButton
        />
        <EntityGroupsList groups={mockGroups} />
      </Flex>
    </ExplorerContainer>
  ),
};

// Story with search and add and list tree
export const WithSearchAndTree: Story = {
  render: () => (
    <ExplorerContainer borderRight="STANDARD">
      <Flex
        backgroundColor="var(--ads-v2-color-bg)"
        flexDirection="column"
        gap="spaces-2"
        height="600px"
        p="spaces-2"
        width="300px"
      >
        <SearchAndAdd
          onAdd={() => {
            // eslint-disable-next-line no-console
            console.log("Add clicked");
          }}
          onSearch={(query: string) => {
            // eslint-disable-next-line no-console
            console.log("Search:", query);
          }}
          placeholder="Search items..."
          showAddButton
        />
        <EntityListTree
          ItemComponent={TreeItemComponent}
          items={mockTreeItems}
          onItemExpand={(id: string) => {
            // eslint-disable-next-line no-console
            console.log("Item expanded:", id);
          }}
        />
      </Flex>
    </ExplorerContainer>
  ),
};

// Story with segments and list without groups
export const WithSegmentsAndList: Story = {
  render: () => (
    <ExplorerContainer borderRight="STANDARD">
      <EditorSegments
        onSegmentChange={(value: string) => {
          // eslint-disable-next-line no-console
          console.log("Segment changed:", value);
        }}
        options={mockSegments.options}
        selectedSegment={mockSegments.selectedSegment}
      />
      <Flex
        backgroundColor="var(--ads-v2-color-bg)"
        flexDirection="column"
        gap="spaces-2"
        height="600px"
        p="spaces-2"
        width="300px"
      >
        <ListWithHeader
          headerControls={
            <Button isIconButton kind="secondary" startIcon="add-line" />
          }
          headerText="Items"
        >
          {mockTreeItems.map((item) => (
            <EntityItem
              id={item.id}
              key={item.id}
              nameEditorConfig={defaultNameEditorConfig}
              onClick={() => {
                // eslint-disable-next-line no-console
                console.log("Item clicked:", item);
              }}
              startIcon={<Icon name="apps-line" />}
              title={item.name}
            />
          ))}
        </ListWithHeader>
      </Flex>
    </ExplorerContainer>
  ),
};
