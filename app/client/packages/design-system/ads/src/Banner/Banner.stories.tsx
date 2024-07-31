import type { StoryObj } from "@storybook/react";
import React from "react";
import { MemoryRouter } from "react-router-dom";

import { Banner } from "./Banner";

export default {
  title: "ADS/Components/Banner",
  component: Banner,
  argTypes: {
    link: {
      control: {
        type: "object",
      },
      description: "Link to be displayed",
      table: {
        type: {
          summary: "CalloutLinkProps",
        },
      },
    },
    isClosable: {
      control: {
        type: "boolean",
      },
      description: "Whether or not the callout should be closable",
      table: {
        type: {
          summary: "boolean",
        },
        defaultValue: {
          summary: false,
        },
      },
    },
    kind: {
      control: {
        type: "select",
        options: ["info", "success", "warning", "error"],
      },
      description: "visual style to be used indicating type of banner",
      table: {
        type: {
          summary: "info | success | warning | error",
        },
        defaultValue: {
          summary: "info",
        },
      },
    },
    children: {
      control: {
        type: "text",
      },
      description: "Content to be displayed",
      table: {
        type: {
          summary: "ReactNode",
        },
      },
    },
    onClose: {
      control: {
        type: "function",
      },
      description: "Callback to be executed when the callout is closed",
      table: {
        type: {
          summary: "() => void",
        },
      },
    },
    className: {
      control: {
        type: "text",
      },
      description: "try not to) pass addition classes here",
      table: {
        type: {
          summary: "string",
        },
      },
    },
  },
  decorators: [
    (Story: () => React.ReactNode) => <MemoryRouter>{Story()}</MemoryRouter>,
  ],
};

// eslint-disable-next-line react/function-component-definition
type Story = StoryObj<typeof Banner>;

export const BannerStory: Story = {
  name: "Banner",
  args: {
    link: {
      to: "/",
      children: "Home",
    },
    isClosable: true,
    kind: "info",
    children: "There are many variations of passages of Lorem Ipsum available.",
    className: "",
  },
};
