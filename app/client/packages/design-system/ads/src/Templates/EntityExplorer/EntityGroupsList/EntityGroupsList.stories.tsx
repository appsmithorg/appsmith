/* eslint-disable no-console */
import React from "react";
import type { Meta, StoryObj } from "@storybook/react";

import { EntityGroupsList, EntityGroup } from "./EntityGroupsList";
import type {
  EntityGroupsListProps,
  EntityGroupProps,
} from "./EntityGroupsList.types";
import { Icon } from "../../../Icon";

const meta: Meta<typeof EntityGroupsList> = {
  title: "ADS/Templates/Entity Explorer/Entity Groups List",
  component: EntityGroupsList,
};

export default meta;

const EntityGroupTemplate = <T,>(props: EntityGroupProps<T>) => {
  const { addConfig, className, groupTitle, items } = props;

  return <EntityGroup group={{ addConfig, className, groupTitle, items }} />;
};

export const SingleGroupWithAddNLazyLoad = EntityGroupTemplate.bind(
  {},
) as StoryObj;

SingleGroupWithAddNLazyLoad.args = {
  groupTitle: "Datasources",
  className: "t--from-source-list",
  items: [
    {
      startIcon: <Icon name="database-2-line" />,
      className: "t--datasource-create-option-users",
      title: "Users",
      onClick: () => console.log("Users clicked"),
    },
    {
      startIcon: <Icon name="database-2-line" />,
      className: "t--datasource-create-option-movies",
      title: "Movies",
      onClick: () => console.log("Movies clicked"),
    },
    {
      startIcon: <Icon name="database-2-line" />,
      className: "t--datasource-create-option-untitled_datasource_1",
      title: "Untitled datasource 1",
      onClick: () => console.log("Untitled datasource 1 clicked"),
    },
    {
      startIcon: <Icon name="database-2-line" />,
      className: "t--datasource-create-option-untitled_datasource_2",
      title: "Untitled datasource 2",
      onClick: () => console.log("Untitled datasource 2 clicked"),
    },
    {
      startIcon: <Icon name="database-2-line" />,
      className: "t--datasource-create-option-untitled_datasource_3",
      title: "Untitled datasource 3",
      onClick: () => console.log("Untitled datasource 3 clicked"),
    },
    {
      startIcon: <Icon name="database-2-line" />,
      className: "t--datasource-create-option-untitled_datasource_4",
      title: "Untitled datasource 4",
      onClick: () => console.log("Untitled datasource 4 clicked"),
    },
    {
      startIcon: <Icon name="database-2-line" />,
      className: "t--datasource-create-option-users_(1)",
      title: "Users (1)",
      onClick: () => console.log("Users(1) clicked"),
    },
  ],
  addConfig: {
    icon: <Icon name="plus" />,
    title: "New datasource",
    onClick: () => console.log("New datasource clicked"),
  },
};

const EntityGroupsListTemplate = <T,>(props: EntityGroupsListProps<T>) => {
  const { groups } = props;

  return <EntityGroupsList groups={groups} showDivider />;
};

export const MultipleGroupsWithAddNLazyLoad = EntityGroupsListTemplate.bind(
  {},
) as StoryObj;

MultipleGroupsWithAddNLazyLoad.args = {
  groups: [
    {
      groupTitle: "Datasources",
      className: "t--from-source-list",
      items: [
        {
          startIcon: <Icon name="database-2-line" />,
          className: "t--datasource-create-option-users",
          title: "Users",
          onClick: () => console.log("Users clicked"),
        },
        {
          startIcon: <Icon name="database-2-line" />,
          className: "t--datasource-create-option-movies",
          title: "Movies",
          onClick: () => console.log("Movies clicked"),
        },
        {
          startIcon: <Icon name="database-2-line" />,
          className: "t--datasource-create-option-untitled_datasource_1",
          title: "Untitled datasource 1",
          onClick: () => console.log("Untitled datasource 1 clicked"),
        },
      ],
      addConfig: {
        icon: <Icon name="plus" />,
        title: "New datasource",
        onClick: () => console.log("New datasource clicked"),
      },
    },
    {
      groupTitle: "Apis",
      className: "t--from-source-list",
      items: [
        {
          startIcon: <Icon name="database-2-line" />,
          className: "t--datasource-create-option-users",
          title: "Users",
          onClick: () => console.log("Users clicked"),
        },
        {
          startIcon: <Icon name="database-2-line" />,
          className: "t--datasource-create-option-movies",
          title: "Movies",
          onClick: () => console.log("Movies clicked"),
        },
        {
          startIcon: <Icon name="database-2-line" />,
          className: "t--datasource-create-option-untitled_datasource_1",
          title: "Untitled datasource 1",
          onClick: () => console.log("Untitled datasource 1 clicked"),
        },
        {
          startIcon: <Icon name="database-2-line" />,
          className: "t--datasource-create-option-untitled_datasource_2",
          title: "Untitled datasource 2",
          onClick: () => console.log("Untitled datasource 2 clicked"),
        },
        {
          startIcon: <Icon name="database-2-line" />,
          className: "t--datasource-create-option-untitled_datasource_3",
          title: "Untitled datasource 3",
          onClick: () => console.log("Untitled datasource 3 clicked"),
        },
        {
          startIcon: <Icon name="database-2-line" />,
          className: "t--datasource-create-option-untitled_datasource_4",
          title: "Untitled datasource 4",
          onClick: () => console.log("Untitled datasource 4 clicked"),
        },
      ],
    },
    {
      groupTitle: "Apis",
      className: "t--from-source-list",
      items: [
        {
          startIcon: <Icon name="database-2-line" />,
          className: "t--datasource-create-option-users",
          title: "Users",
          onClick: () => console.log("Users clicked"),
        },
        {
          startIcon: <Icon name="database-2-line" />,
          className: "t--datasource-create-option-movies",
          title: "Movies",
          onClick: () => console.log("Movies clicked"),
        },
      ],
    },
  ],
};
