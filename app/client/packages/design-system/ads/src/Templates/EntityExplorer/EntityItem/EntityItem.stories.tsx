/* eslint-disable no-console */
import React from "react";
import type { Meta, StoryObj } from "@storybook/react";

import { EntityItem } from "./EntityItem";
import type { EntityItemProps } from "./EntityItem.types";
import { ExplorerContainer } from "../ExplorerContainer";
import { Flex, Button, Icon } from "../../..";

const meta: Meta<typeof EntityItem> = {
  title: "ADS/Templates/Entity Explorer/Entity Item",
  component: EntityItem,
};

export default meta;

const Template = (props: EntityItemProps) => {
  const { name, nameEditorConfig } = props;

  const onClick = () => console.log("Add clicked");

  const rightControl = (
    <Button isIconButton kind="tertiary" startIcon="comment-context-menu" />
  );

  const startIcon = <Icon name="apps-line" />;

  return (
    <Flex bg="white" overflow="hidden" width="400px">
      <ExplorerContainer borderRight="STANDARD" height="500px" width="255px">
        <Flex p="spaces-3">
          <EntityItem
            {...{
              startIcon,
              name,
              nameEditorConfig,
              onClick,
              rightControl,
            }}
          />
        </Flex>
      </ExplorerContainer>
    </Flex>
  );
};

export const Basic = Template.bind({}) as StoryObj;

Basic.args = {
  name: "Entity Name",
};

export const InEditingMode = Template.bind({}) as StoryObj;

InEditingMode.args = {
  name: "Entity Name",
  nameEditorConfig: {
    isEditing: true,
    canEdit: true,
  },
};
