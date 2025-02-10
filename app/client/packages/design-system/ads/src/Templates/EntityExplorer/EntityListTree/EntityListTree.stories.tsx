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
import noop from "lodash/noop";

const meta: Meta<typeof EntityListTree> = {
  title: "ADS/Templates/Entity Explorer/Entity List Tree",
  component: EntityListTree,
};

export default meta;

const onClick = noop;
const nameEditorConfig = {
  canEdit: true,
  isEditing: false,
  isLoading: false,
  onEditComplete: noop,
  onNameSave: noop,
  validateName: () => null,
};

const Tree: EntityListTreeProps["items"] = [
  {
    startIcon: <Icon name="apps-line" />,
    id: "1",
    title: "Parent 1",
    isExpanded: true,
    onClick,
    nameEditorConfig,
    children: [
      {
        startIcon: <Icon name="apps-line" />,
        id: "1.1",
        title: "Child 1",
        isExpanded: false,
        isSelected: true,
        onClick,
        nameEditorConfig,
        children: [
          {
            startIcon: <Icon name="apps-line" />,
            id: "1.1.1",
            title: "Grandchild 1",
            isExpanded: false,
            onClick,
            nameEditorConfig,
          },
          {
            startIcon: <Icon name="apps-line" />,
            id: "1.1.2",
            isDisabled: true,
            title: "Grandchild 2",
            isExpanded: false,
            onClick,
            nameEditorConfig,
          },
        ],
      },
      {
        startIcon: <Icon name="apps-line" />,
        id: "1.2",
        title: "Child 2",
        isExpanded: false,
        onClick,
        nameEditorConfig,
      },
    ],
  },
  {
    startIcon: <Icon name="apps-line" />,
    id: "2",
    title: "Parent 2",
    isExpanded: false,
    onClick,
    nameEditorConfig,
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

const Template = (props: { outsideSelection: string }) => {
  const [expanded, setExpanded] = React.useState<Record<string, boolean>>({});
  const [selected, setSelected] = React.useState<string | null>(
    props.outsideSelection,
  );
  const [editing, setEditing] = React.useState<string | null>(null);

  useEffect(
    function handleSyncOfSelection() {
      setSelected(props.outsideSelection);
    },
    [props.outsideSelection],
  );

  const onExpandClick = (id: string) => {
    setExpanded((prev) => ({ ...prev, [id]: !Boolean(prev[id]) }));
  };

  const onItemSelect = (id: string) => {
    setSelected(id);
  };

  const onItemEdit = (id: string) => {
    setEditing(id);
  };

  const completeEdit = () => {
    setEditing(null);
  };

  const updatedTree = treeUpdate(Tree, (item) => ({
    ...item,
    isExpanded: Boolean(expanded[item.id]),
    isSelected: item.id === selected,
    onClick: () => onItemSelect(item.id),
    onDoubleClick: () => onItemEdit(item.id),
    nameEditorConfig: {
      canEdit: true,
      isEditing: item.id === editing,
      isLoading: false,
      onEditComplete: completeEdit,
      onNameSave: noop,
      validateName: () => null,
    },
  }));

  return (
    <Flex bg="white" overflow="hidden" width="400px">
      <ExplorerContainer borderRight="STANDARD" height="500px" width="255px">
        <Flex flexDirection="column" gap="spaces-2" p="spaces-3">
          <EntityListTree items={updatedTree} onItemExpand={onExpandClick} />
        </Flex>
      </ExplorerContainer>
    </Flex>
  );
};

export const Basic = Template.bind({}) as StoryObj;

Basic.args = {
  outsideSelection: "1",
};
