/* eslint-disable no-console */
import React, { useEffect } from "react";
import type { Meta, StoryObj } from "@storybook/react";

import { EntityListTree } from "./EntityListTree";
import type {
  EntityListTreeItem,
  EntityListTreeProps,
} from "./EntityListTree.types";
import { ExplorerContainer } from "../ExplorerContainer";
import { Flex, Icon } from "../../..";
import { EntityItem } from "../EntityItem";
import { noop } from "lodash";

const meta: Meta<typeof EntityListTree> = {
  title: "ADS/Templates/Entity Explorer/Entity List Tree",
  component: EntityListTree,
};

export default meta;

const nameEditorConfig = {
  canEdit: true,
  isEditing: false,
  isLoading: false,
  onEditComplete: noop,
  onNameSave: noop,
  validateName: () => null,
};

const names = {
  "1": "Parent 1",
  "1.1": "Child 1.1",
  "1.1.1": "Child 1.1.1",
  "1.1.2": "Child 1.1.2",
  "1.2": "Child 1.2",
  "2": "Parent 2",
};

const Tree: EntityListTreeProps["items"] = [
  {
    id: "1",
    isExpanded: true,
    isSelected: false,
    children: [
      {
        id: "1.1",
        isExpanded: false,
        isSelected: true,
        children: [
          {
            id: "1.1.1",
            isExpanded: false,
            isSelected: false,
          },
          {
            id: "1.1.2",
            isDisabled: true,
            isExpanded: false,
            isSelected: false,
          },
        ],
      },
      {
        id: "1.2",
        isExpanded: false,
        isSelected: false,
      },
    ],
  },
  {
    id: "2",
    isExpanded: false,
    isSelected: false,
  },
];

const treeUpdate = (
  items: EntityListTreeProps["items"],
  updater: (item: EntityListTreeItem) => EntityListTreeItem,
) => {
  return items.map((item): EntityListTreeItem => {
    return {
      ...updater(item),
      children: item.children ? treeUpdate(item.children, updater) : undefined,
    };
  });
};

const EntityItemComponent = (props: { item: EntityListTreeItem }) => {
  const { item } = props;
  const [editing, setEditing] = React.useState<string | null>(null);
  const onItemEdit = (id: string) => {
    setEditing(id);
  };

  const completeEdit = () => {
    setEditing(null);
  };

  return (
    <EntityItem
      {...item}
      nameEditorConfig={{
        ...nameEditorConfig,
        isEditing: item.id === editing,
        onEditComplete: completeEdit,
        onNameSave: noop,
        validateName: () => null,
      }}
      onClick={noop}
      onDoubleClick={() => onItemEdit(item.id)}
      startIcon={<Icon name="apps-line" />}
      title={names[item.id as keyof typeof names] || item.id}
    />
  );
};

const Template = (props: { selectedItem: string }) => {
  const [expanded, setExpanded] = React.useState<Record<string, boolean>>({});
  const [selected, setSelected] = React.useState<string | null>(
    props.selectedItem,
  );

  useEffect(
    function handleSyncOfSelection() {
      setSelected(props.selectedItem);
    },
    [props.selectedItem],
  );

  const onExpandClick = (id: string) => {
    setExpanded((prev) => ({ ...prev, [id]: !Boolean(prev[id]) }));
  };

  const updatedTree = treeUpdate(Tree, (item) => ({
    ...item,
    isExpanded: Boolean(expanded[item.id]),
    isSelected: item.id === selected,
  }));

  return (
    <Flex bg="white" overflow="hidden" width="400px">
      <ExplorerContainer borderRight="STANDARD" height="500px" width="255px">
        <Flex flexDirection="column" gap="spaces-2" p="spaces-3">
          <EntityListTree
            ItemComponent={EntityItemComponent}
            items={updatedTree}
            onItemExpand={onExpandClick}
          />
        </Flex>
      </ExplorerContainer>
    </Flex>
  );
};

export const Basic = Template.bind({}) as StoryObj;

Basic.args = {
  selectedItem: "1",
};
