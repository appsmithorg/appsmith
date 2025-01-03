/* eslint-disable no-console */
import React from "react";
import type { Meta, StoryObj } from "@storybook/react";

import { EntityListTree } from "./EntityListTree";
import type { EntityListTreeProps } from "./EntityListTree.types";
import { ExplorerContainer } from "../ExplorerContainer";
import { Flex, Icon } from "../../..";
import { noop } from "lodash";

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
        isExpanded: true,
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

const Template = () => {
  const [expanded, setExpanded] = React.useState<Record<string, boolean>>({});

  console.log({ expanded });

  const onExpandClick = (id: string) => {
    setExpanded((prev) => ({ ...prev, [id]: !Boolean(prev[id]) }));
  };

  return (
    <Flex bg="white" overflow="hidden" width="400px">
      <ExplorerContainer borderRight="STANDARD" height="500px" width="255px">
        <Flex flexDirection="column" gap="spaces-2" p="spaces-3">
          <EntityListTree items={Tree} onItemExpand={onExpandClick} />
        </Flex>
      </ExplorerContainer>
    </Flex>
  );
};

export const Basic = Template.bind({}) as StoryObj;

Basic.args = {};
