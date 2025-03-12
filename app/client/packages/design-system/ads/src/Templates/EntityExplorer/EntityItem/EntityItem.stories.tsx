/* eslint-disable no-console */
import React from "react";
import type { Meta, StoryObj } from "@storybook/react";

import { EntityItem } from "./EntityItem";
import type { EntityItemProps } from "./EntityItem.types";
import { ExplorerContainer } from "../ExplorerContainer";
import { Flex, Button, Icon, Callout } from "../../..";

const meta: Meta<typeof EntityItem> = {
  title: "ADS/Templates/Entity Explorer/Entity Item",
  component: EntityItem,
};

export default meta;

const Template = (props: EntityItemProps) => {
  const { hasError, isDisabled, isSelected, nameEditorConfig, title } = props;
  const [isEditing, setIsEditing] = React.useState(false);

  const onEditComplete = () => {
    setIsEditing(false);
  };
  const onNameSave = (name: string) => console.log("Name saved" + name);

  const onClick = () => console.log("Add clicked");

  const rightControl = (
    <Button isIconButton kind="tertiary" startIcon="comment-context-menu" />
  );

  const startIcon = <Icon name="apps-line" />;

  return (
    <Flex bg="white" overflow="hidden" width="400px">
      <ExplorerContainer borderRight="STANDARD" height="500px" width="255px">
        <Flex flexDirection="column" gap="spaces-2" p="spaces-3">
          <EntityItem
            id="storyItem"
            onDoubleClick={() => {
              setIsEditing(true);
            }}
            {...{
              startIcon,
              title,
              hasError,
              isSelected,
              isDisabled,
              nameEditorConfig: {
                ...nameEditorConfig,
                isEditing,
                onEditComplete,
                onNameSave,
              },
              onClick,
              rightControl,
            }}
          />
          <Callout>Double click the name to edit it</Callout>
        </Flex>
      </ExplorerContainer>
    </Flex>
  );
};

export const InEditingMode = Template.bind({}) as StoryObj;

InEditingMode.args = {
  title: "EntityName",
  nameEditorConfig: {
    canEdit: true,
    validateName: () => null,
  },
};

export const NoPermissionToEdit = Template.bind({}) as StoryObj;

NoPermissionToEdit.args = {
  title: "EntityName",
  nameEditorConfig: {
    canEdit: false,
    validateName: () => null,
  },
};

export const RenamingError = Template.bind({}) as StoryObj;

RenamingError.args = {
  title: "EntityName",
  nameEditorConfig: {
    canEdit: true,
    validateName: () => "This is a sample error",
  },
};

export const SelectedState = Template.bind({}) as StoryObj;

SelectedState.args = {
  title: "EntityName",
  isSelected: true,
  nameEditorConfig: {
    canEdit: true,
    validateName: () => null,
  },
};

export const DisabledState = Template.bind({}) as StoryObj;

DisabledState.args = {
  title: "EntityName",
  isDisabled: true,
  nameEditorConfig: {
    canEdit: true,
    validateName: () => null,
  },
};

export const LoadingState = Template.bind({}) as StoryObj;

LoadingState.args = {
  title: "EntityName",
  nameEditorConfig: {
    isLoading: true,
    canEdit: true,
    validateName: () => null,
  },
};
