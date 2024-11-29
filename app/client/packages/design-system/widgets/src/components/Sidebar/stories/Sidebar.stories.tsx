import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Sidebar, SidebarTrigger, SidebarProvider } from "../src/index";
import { Text, Icon, Flex } from "@appsmith/wds";

import { ControlledStateSidebar } from "./ControlledStateSidebar";

const meta: Meta<typeof Sidebar> = {
  component: Sidebar,
  title: "WDS/Widgets/Sidebar",
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "A responsive sidebar component that supports different positions, variants, and collapse behaviors.",
      },
    },
  },
  args: {
    title: "Sidebar",
  },
  render: (args) => (
    <SidebarProvider
      defaultState="collapsed"
      style={{
        height: "50vh",
        border: "1px solid var(--color-bd-elevation-1)",
      }}
    >
      <Flex alignItems="start" margin="spacing-4" width="100%">
        <SidebarTrigger />
      </Flex>
      <Sidebar {...args}>
        <DemoContent />
      </Sidebar>
    </SidebarProvider>
  ),
};

export default meta;
type Story = StoryObj<typeof Sidebar>;

const DemoContent = () => (
  <Flex direction="column" gap="spacing-2" padding="spacing-4">
    <Text color="neutral-subtle" size="caption">
      Applications
    </Text>
    <Flex direction="column" gap="spacing-3" marginTop="spacing-2">
      <Flex alignItems="center" gap="spacing-2">
        <Icon name="home" />
        <Text size="body">Home</Text>
      </Flex>
      <Flex alignItems="center" gap="spacing-2">
        <Icon name="inbox" />
        <Text size="body">Inbox</Text>
      </Flex>
      <Flex alignItems="center" gap="spacing-2">
        <Icon name="calendar" />
        <Text size="body">Calendar</Text>
      </Flex>
    </Flex>
  </Flex>
);

export const Default: Story = {
  args: {},
};

export const SideLeft: Story = {
  args: {},
  render: (args) => (
    <SidebarProvider
      side="start"
      style={{
        height: "50vh",
        border: "1px solid var(--color-bd-elevation-1)",
      }}
    >
      <Sidebar {...args}>
        <DemoContent />
      </Sidebar>
      <Flex alignItems="start" margin="spacing-4" width="100%">
        <SidebarTrigger />
      </Flex>
    </SidebarProvider>
  ),
};

export const WithRenderProps: Story = {
  render: (args) => (
    <SidebarProvider
      style={{
        height: "50vh",
        border: "1px solid var(--color-bd-elevation-1)",
      }}
    >
      <Flex alignItems="start" margin="spacing-4" width="100%">
        <SidebarTrigger />
      </Flex>
      <Sidebar {...args}>
        {({ isAnimating, state }) => (
          <Flex direction="column" gap="spacing-2" padding="spacing-4">
            <Text color="neutral-subtle" size="caption">
              Sidebar State
            </Text>
            <Flex direction="column" gap="spacing-3" marginTop="spacing-2">
              <Flex alignItems="center" gap="spacing-2">
                <Icon
                  name={
                    state === "collapsed"
                      ? "arrows-diagonal-2"
                      : "arrows-diagonal-minimize"
                  }
                />
                <Flex gap="spacing-1">
                  <Text size="body">{state}</Text>
                  <Text color="neutral-subtle" size="caption">
                    {isAnimating ? "(Animating)" : ""}
                  </Text>
                </Flex>
              </Flex>
            </Flex>
          </Flex>
        )}
      </Sidebar>
    </SidebarProvider>
  ),
};

export const WithControlledState: Story = {
  render: (args) => {
    return (
      <ControlledStateSidebar {...args}>
        <DemoContent />
      </ControlledStateSidebar>
    );
  },
};
