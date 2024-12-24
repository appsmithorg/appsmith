/* eslint-disable no-console */
import React from "react";
import type { Meta, StoryObj } from "@storybook/react";

import { type ExplorerContainerProps, ExplorerContainer } from ".";

import { SearchAndAdd } from "..";
import { Flex } from "../../../Flex";

const meta: Meta<typeof ExplorerContainer> = {
  title: "ADS/Templates/Entity Explorer/Container",
  component: ExplorerContainer,
  argTypes: {
    borderRight: {
      options: ["STANDARD", "NONE"],
      control: { type: "select" },
    },
  },
};

export default meta;

const Template = (props: ExplorerContainerProps) => {
  const { borderRight, children, className, height, width } = props;

  return (
    <ExplorerContainer
      {...{
        children,
        width,
        height,
        className,
        borderRight,
      }}
    />
  );
};

export const Basic = Template.bind({}) as StoryObj;

const Children = () => {
  return (
    <Flex flexDirection="column" p="spaces-2">
      <SearchAndAdd showAddButton={false} />
    </Flex>
  );
};

Basic.args = {
  children: <Children />,
  borderRight: "STANDARD",
  height: "300px",
  width: "255px",
};
