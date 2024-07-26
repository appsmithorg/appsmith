import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { AnnouncementModal } from "./AnnouncementModal";
import { Button } from "../Button";

export default {
  title: "ADS/Components/Announcement",
  component: AnnouncementModal,
} as Meta<typeof AnnouncementModal>;

type Story = StoryObj<typeof AnnouncementModal>;

export const AnnouncementModalStory: Story = {
  name: "Modal",
  args: {
    banner: "https://assets.appsmith.com/new-sidebar-banner.svg",
    description:
      "You can now write queries & JS functions as you refer to your UI on the side. This is a beta version that we will continue to improve with your feedback.",
    title: "Code and UI side-by-side",
    footer: (
      <>
        <Button kind="primary" size="md">
          Try out
        </Button>
        <Button kind="tertiary" size="md">
          Learn More
        </Button>
      </>
    ),
    isOpen: true,
    isBeta: true,
  },
  render: (args) => <AnnouncementModal {...args} />,
};
