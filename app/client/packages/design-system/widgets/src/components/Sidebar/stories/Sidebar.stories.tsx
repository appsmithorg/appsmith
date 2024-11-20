import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import {
  Sidebar,
  SidebarTrigger,
  SidebarProvider,
  SidebarInset,
} from "../src/index";
import { Flex } from "../../Flex";
import { Text, Icon } from "@appsmith/wds";

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
    side: "start",
    variant: "sidebar",
  },
  render: (args) => (
    <SidebarProvider
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

export const SideRight: Story = {
  args: {
    side: "end",
  },
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
        <DemoContent />
      </Sidebar>
    </SidebarProvider>
  ),
};

export const VariantFloating: Story = {
  args: {
    variant: "floating",
  },
};

export const VariantInset: Story = {
  args: {
    variant: "inset",
  },
  render: (args) => (
    <SidebarProvider
      style={{
        height: "50vh",
        border: "1px solid var(--color-bd-elevation-1)",
      }}
    >
      <Sidebar {...args}>
        <DemoContent />
      </Sidebar>
      <SidebarInset>
        <Flex alignItems="start" margin="spacing-4" width="100%">
          <SidebarTrigger />
        </Flex>
      </SidebarInset>
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
      <Sidebar {...args}>
        {({ isAnimating, state }) => (
          <Text>{isAnimating ? "Animating" : state}</Text>
        )}
      </Sidebar>
      <SidebarInset>
        <Flex alignItems="start" margin="spacing-4" width="100%">
          <SidebarTrigger />
        </Flex>
      </SidebarInset>
    </SidebarProvider>
  ),
};
