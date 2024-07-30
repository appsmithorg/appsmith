import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";

import {
  AnnouncementPopover,
  AnnouncementPopoverContent,
  AnnouncementPopoverTrigger,
} from "./AnnouncementPopover";
import { Button } from "../Button";
import { Flex } from "../Flex";

export default {
  title: "ADS/Components/Announcement",
  component: AnnouncementPopover,
  decorators: [
    (Story) => (
      <div
        style={{
          height: "50vh",
          display: "flex",
          alignItems: "center",
        }}
      >
        <Story />
      </div>
    ),
  ],
} as Meta<typeof AnnouncementPopover>;

type Story = StoryObj<typeof AnnouncementPopover>;

export const AnnouncementPopoverStory: Story = {
  name: "Popover",
  args: {
    open: true,
  },
  argTypes: {
    open: {
      control: {
        type: "boolean",
      },
      description:
        "Whether the popover is open or not. By default popover opens based on hover",
      table: {
        type: {
          summary: "boolean",
        },
        defaultValue: {
          summary: "false",
        },
      },
    },
    defaultOpen: {
      control: {
        type: "boolean",
      },
      description: "Whether the popover is open by default or not",
      table: {
        type: {
          summary: "boolean",
        },
        defaultValue: {
          summary: "false",
        },
      },
    },
    openDelay: {
      control: {
        type: "number",
      },
      description: "Delay in ms before the popover opens.",
      table: {
        type: {
          summary: "number",
        },
        defaultValue: {
          summary: "700",
        },
      },
    },
    closeDelay: {
      control: {
        type: "number",
      },
      description: "Delay in ms before the popover closes.",
      table: {
        type: {
          summary: "number",
        },
        defaultValue: {
          summary: "300",
        },
      },
    },
  },
  render: function Render(args) {
    const [open, setOpen] = useState(args.open);

    return (
      <AnnouncementPopover {...args} open={open}>
        <AnnouncementPopoverTrigger>
          <span>Something that trigger the announcement</span>
        </AnnouncementPopoverTrigger>
        <AnnouncementPopoverContent
          arrowFillColor="#F6F2FA"
          banner="https://assets.appsmith.com/new-sidebar-banner.svg"
          description="Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s."
          footer={
            <Flex gap="spaces-3">
              <Button kind="primary" onClick={() => setOpen(false)} size="md">
                Got it
              </Button>
              <Button kind="tertiary" onClick={() => setOpen(false)} size="md">
                Read more
              </Button>
            </Flex>
          }
          onCloseButtonClick={() => setOpen(false)}
          side="bottom"
          title="Title of the banner"
        />
      </AnnouncementPopover>
    );
  },
};

type StoryContent = StoryObj<typeof AnnouncementPopoverContent>;

export const AnnouncementPopoverContentStory: StoryContent = {
  name: "Popover Content",
  args: {
    arrowFillColor: "#F6F2FA",
    banner: "https://assets.appsmith.com/new-sidebar-banner.svg",
    description:
      "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s.",
    side: "bottom",
    title: "Title of the banner",
  },
  argTypes: {
    side: {
      control: {
        type: "select",
      },
      options: ["top", "right", "bottom", "left"],
      description: "Side of the popover",
      table: {
        type: {
          summary: "top | right | bottom | left",
        },
        defaultValue: {
          summary: "bottom",
        },
      },
    },
    sideOffset: {
      control: {
        type: "number",
      },
      description: "The distance in pixels from the trigger.",
      table: {
        type: {
          summary: "number",
        },
        defaultValue: {
          summary: "0",
        },
      },
    },
    align: {
      control: {
        type: "select",
      },
      options: ["start", "center", "end"],
      description: "Align of the popover",
      table: {
        type: {
          summary: "start | center | end",
        },
        defaultValue: {
          summary: "start",
        },
      },
    },
    alignOffset: {
      control: {
        type: "number",
      },
      description:
        "An offset in pixels from the 'start' or 'end' alignment options.",
      table: {
        type: {
          summary: "number",
        },
        defaultValue: {
          summary: "0",
        },
      },
    },
    avoidCollisions: {
      control: {
        type: "boolean",
      },
      description:
        "When true, overrides the side andalign preferences to prevent collisions with boundary edges.",
      table: {
        type: {
          summary: "boolean",
        },
        defaultValue: {
          summary: "true",
        },
      },
    },
    collisionBoundary: {
      control: {
        type: "number",
      },
      description:
        "The element used as the collision boundary. By default this is the viewport, though you can provide additional element(s) to be included in this check.",
      table: {
        type: {
          summary: "Element | null | Array<Element | null>",
        },
        defaultValue: {
          summary: "[]",
        },
      },
    },
    collisionPadding: {
      control: {
        type: "number",
      },
      description:
        "The distance in pixels from the boundary edges where collision detection should occur. Accepts a number (same for all sides), or a partial padding object, for example: { top: 20, left: 20 }.",
      table: {
        type: {
          summary:
            "number | { top: number, right: number, bottom: number, left: number }",
        },
        defaultValue: {
          summary: "0",
        },
      },
    },
    hideWhenDetached: {
      control: {
        type: "boolean",
      },
      description:
        "Whether to hide the content when the trigger becomes fully occluded.",
      table: {
        type: {
          summary: "boolean",
        },
        defaultValue: {
          summary: "false",
        },
      },
    },
    arrowFillColor: {
      control: {
        type: "color",
      },
      description: "The fill color of the arrow.",
      table: {
        type: {
          summary: "string",
        },
        defaultValue: {
          summary: "var(--ads-v2-colors-content-surface-default-bg)",
        },
      },
    },
    banner: {
      control: {
        type: "text",
      },
      description: "The banner image url.",
      table: {
        type: {
          summary: "string",
        },
      },
    },
    title: {
      control: {
        type: "text",
      },
      description: "The title of the banner.",
      table: {
        type: {
          summary: "string",
        },
      },
    },
    description: {
      control: {
        type: "text",
      },
      description: "The description of the banner.",
      table: {
        type: {
          summary: "string",
        },
      },
    },
    onCloseButtonClick: {
      control: {
        type: "number",
      },
      description: "Callback when the close button is clicked.",
      table: {
        type: {
          summary: "() => void",
        },
      },
    },
  },
  render: function Render(args) {
    return (
      <AnnouncementPopover open>
        <AnnouncementPopoverTrigger>
          <span>Something that trigger the announcement</span>
        </AnnouncementPopoverTrigger>
        <AnnouncementPopoverContent
          {...args}
          footer={
            <Button kind="primary" size="md">
              Got it
            </Button>
          }
        />
      </AnnouncementPopover>
    );
  },
};
